import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pool } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
// POST /api/questions/generate
router.post('/generate', authMiddleware, async (req, res) => {
  const { topic, difficulty = 'medium' } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  try {
    const aiResult = await model.generateContent(`You are a technical interviewer at a company interviewing a new grad or junior software engineer with 0-2 years of experience. Generate a ${difficulty} difficulty VERBAL interview question about: ${topic}.

Difficulty guidelines:
- Easy: Basic definitions and concepts a CS student should know (e.g. "What is a REST API?")
- Medium: Concepts a junior dev would encounter on the job (e.g. "What is the difference between authentication and authorization?")
- Hard: Slightly deeper understanding but still appropriate for someone with 1-2 years experience (e.g. "What is the difference between SQL and NoSQL and when would you choose one over the other?")

Important rules:
- Do NOT generate coding problems or "given an array..." style questions
- Do NOT ask senior/architect level questions about complex distributed systems
- For DSA topics: ask the candidate to EXPLAIN the concept, compare approaches, or describe when they would use it
- For Concepts topics: ask about software engineering concepts appropriate for a junior dev
- For Behavioral topics: ask situational questions relevant to early career (e.g. "Tell me about a time you encountered a difficult bug and how you solved it")
- For SQL topics: ask them to explain concepts or write a simple query verbally
- Keep questions clear and concise — one focused question, not three questions in one

Return ONLY a JSON object with this exact shape, no markdown:
{
  "question": "the interview question text",
  "hint": "a subtle hint without giving it away",
  "answer_outline": "key points a strong answer should cover (3-5 bullet points)"
}`);
const raw = aiResult.response.text().trim().replace(/```json\n?|\n?```/g, '').trim();

    const parsed = JSON.parse(raw);

    const result = await pool.query(
      `INSERT INTO questions (user_id, topic, question_text, difficulty)
       VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
      [req.userId, topic, parsed.question, difficulty]
    );

    res.json({
      id: result.rows[0].id,
      topic,
      difficulty,
      question: parsed.question,
      hint: parsed.hint,
      answer_outline: parsed.answer_outline,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

// POST /api/questions/:id/answer
router.post('/:id/answer', authMiddleware, async (req, res) => {
  const { answer } = req.body;
  const { id } = req.params;

  try {
    const qResult = await pool.query(
      'SELECT * FROM questions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    const question = qResult.rows[0];
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const aiResult = await model.generateContent(`Interview question: "${question.question_text}"
          
Candidate's answer: "${answer}"

Give concise, honest interview feedback. Return ONLY JSON:
{
  "score": <1-10>,
  "feedback": "2-3 sentence honest assessment",
  "missed": "key concepts the candidate missed (or null)",
  "strong": "what they did well (or null)"
}`);
const raw = aiResult.response.text().trim().replace(/```json\n?|\n?```/g, '').trim();
    const feedback = JSON.parse(raw);

    await pool.query(
      'UPDATE questions SET user_answer = $1, ai_feedback = $2 WHERE id = $3',
      [answer, JSON.stringify(feedback), id]
    );

    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// GET /api/questions/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, topic, question_text, difficulty, user_answer, ai_feedback, created_at
       FROM questions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;