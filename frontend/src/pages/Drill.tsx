import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import styles from './Drill.module.css';

interface Topic {
  id: number;
  name: string;
  category: string;
  status: string;
}

interface Question {
  id: number;
  topic: string;
  difficulty: string;
  question: string;
  hint: string;
  answer_outline: string;
}

interface Feedback {
  score: number;
  feedback: string;
  missed: string | null;
  strong: string | null;
}

export default function Drill() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
  api.get('/topics').then(r => {
    const drillTopics = r.data.filter((t: Topic) => t.category !== 'DSA');
    setTopics(drillTopics);
    const weak = drillTopics.find((t: Topic) => t.status === 'needs_review') || drillTopics[0];
    if (weak) setSelectedTopic(weak.name);
  });
}, []);

  const generate = async () => {
    if (!selectedTopic) return;
    setGenerating(true);
    setQuestion(null);
    setFeedback(null);
    setAnswer('');
    setShowHint(false);
    setShowOutline(false);
    try {
      const res = await api.post('/questions/generate', { topic: selectedTopic, difficulty });
      setQuestion(res.data);
    } finally {
      setGenerating(false);
    }
  };

  const submitAnswer = async () => {
    if (!question || !answer.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/questions/${question.id}/answer`, { answer });
      setFeedback(res.data);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [...new Set(topics.map(t => t.category))];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>DD</span>
          <span className={styles.logoText}>DevDrill</span>
        </div>
        <nav className={styles.nav}>
          <button className={styles.navItem} onClick={() => navigate('/dashboard')}>⌂ Dashboard</button>
          <button className={`${styles.navItem} ${styles.navActive}`}>⚡ Drill</button>
          <button className={styles.navItem} onClick={() => navigate('/topics')}>◎ Topics</button>
          <button className={styles.navItem} onClick={() => navigate('/history')}>≡ History</button>
        </nav>
      </aside>

      <main className={styles.main}>
        <h1 className={styles.title}>Drill</h1>
        <p className={styles.subtitle}>Generate an AI interview question and get graded feedback.</p>

        <div className={styles.configRow}>
          <div className={styles.configGroup}>
            <label className={styles.configLabel}>Topic</label>
            <select
              className={styles.select}
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
            >
              {categories.map(cat => (
                <optgroup key={cat} label={cat}>
                  {topics.filter(t => t.category === cat).map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className={styles.configGroup}>
            <label className={styles.configLabel}>Difficulty</label>
            <div className={styles.diffBtns}>
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  className={`${styles.diffBtn} ${difficulty === d ? styles[`diff_${d}`] : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={generate}
            disabled={generating || !selectedTopic}
            style={{ alignSelf: 'flex-end' }}
          >
            {generating ? '⟳ Generating...' : '⚡ Generate Question'}
          </button>
        </div>

        {generating && (
          <div className={styles.loading}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <span>Generating question...</span>
          </div>
        )}

        {question && !generating && (
          <div className={styles.questionSection}>
            <div className={styles.questionCard}>
              <div className={styles.qMeta}>
                <span className={`tag tag-${question.difficulty}`}>{question.difficulty}</span>
                <span className={styles.qTopic}>{question.topic}</span>
              </div>
              <p className={styles.questionText}>{question.question}</p>

              <div className={styles.assists}>
                <button
                  className={`btn btn-ghost ${styles.assistBtn}`}
                  onClick={() => setShowHint(!showHint)}
                >
                  {showHint ? 'Hide hint' : '💡 Show hint'}
                </button>
                {feedback && (
                  <button
                    className={`btn btn-ghost ${styles.assistBtn}`}
                    onClick={() => setShowOutline(!showOutline)}
                  >
                    {showOutline ? 'Hide outline' : '📋 Model answer'}
                  </button>
                )}
              </div>

              {showHint && (
                <div className={styles.hint}>
                  <span className={styles.hintLabel}>Hint</span>
                  <p>{question.hint}</p>
                </div>
              )}

              {showOutline && feedback && (
                <div className={styles.outline}>
                  <span className={styles.hintLabel}>Model answer outline</span>
                  <p style={{ whiteSpace: 'pre-line' }}>{question.answer_outline}</p>
                </div>
              )}
            </div>

            {!feedback && (
              <div className={styles.answerSection}>
                <label className={styles.configLabel}>Your answer</label>
                <textarea
                  className={styles.textarea}
                  rows={6}
                  placeholder="Type your answer here. Think out loud — explain your reasoning..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                />
                <div className={styles.answerActions}>
                  <span className={styles.charCount}>{answer.length} chars</span>
                  <button
                    className="btn btn-primary"
                    onClick={submitAnswer}
                    disabled={submitting || !answer.trim()}
                  >
                    {submitting ? 'Evaluating...' : 'Submit for feedback →'}
                  </button>
                </div>
              </div>
            )}

            {feedback && (
              <div className={styles.feedbackCard}>
                <div className={styles.scoreRow}>
                  <div className={styles.score} data-score={Math.round(feedback.score / 3)}>
                    {feedback.score}<span className={styles.scoreMax}>/10</span>
                  </div>
                  <div className={styles.scoreLabel}>
                    {feedback.score >= 8 ? '🎉 Strong answer' : feedback.score >= 5 ? '📈 Getting there' : '💪 Keep practicing'}
                  </div>
                </div>
                <p className={styles.feedbackText}>{feedback.feedback}</p>
                {feedback.strong && (
                  <div className={styles.feedbackChip} data-type="strong">
                    <span>✓ Strong:</span> {feedback.strong}
                  </div>
                )}
                {feedback.missed && (
                  <div className={styles.feedbackChip} data-type="missed">
                    <span>✗ Missed:</span> {feedback.missed}
                  </div>
                )}
                <button className="btn btn-primary" onClick={generate} style={{ marginTop: 16 }}>
                  Next question →
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}