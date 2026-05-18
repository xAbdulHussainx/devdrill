import express from 'express';
import { pool } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/topics — all topics with user status
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.category,
              COALESCE(ut.status, 'learning') as status,
              ut.updated_at
       FROM topics t
       LEFT JOIN user_topics ut ON t.id = ut.topic_id AND ut.user_id = $1
       ORDER BY t.category, t.name`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/topics/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['learning', 'confident', 'needs_review'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  try {
    await pool.query(
      `INSERT INTO user_topics (user_id, topic_id, status, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, topic_id)
       DO UPDATE SET status = $3, updated_at = NOW()`,
      [req.userId, req.params.id, status]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/topics/leetcode-suggestion
router.get('/leetcode-suggestion', authMiddleware, async (req, res) => {
  const problemMap = {
    'Arrays & Hashing': [
      { title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/', difficulty: 'Easy' },
      { title: 'Group Anagrams', url: 'https://leetcode.com/problems/group-anagrams/', difficulty: 'Medium' },
      { title: 'Top K Frequent Elements', url: 'https://leetcode.com/problems/top-k-frequent-elements/', difficulty: 'Medium' },
    ],
    'Two Pointers': [
      { title: 'Valid Palindrome', url: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'Easy' },
      { title: '3Sum', url: 'https://leetcode.com/problems/3sum/', difficulty: 'Medium' },
      { title: 'Container With Most Water', url: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'Medium' },
    ],
    'Sliding Window': [
      { title: 'Best Time to Buy and Sell Stock', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'Easy' },
      { title: 'Longest Substring Without Repeating Characters', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'Medium' },
      { title: 'Minimum Window Substring', url: 'https://leetcode.com/problems/minimum-window-substring/', difficulty: 'Hard' },
    ],
    'Binary Search': [
      { title: 'Binary Search', url: 'https://leetcode.com/problems/binary-search/', difficulty: 'Easy' },
      { title: 'Search in Rotated Sorted Array', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', difficulty: 'Medium' },
      { title: 'Find Minimum in Rotated Sorted Array', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', difficulty: 'Medium' },
    ],
    'BFS / DFS': [
      { title: 'Number of Islands', url: 'https://leetcode.com/problems/number-of-islands/', difficulty: 'Medium' },
      { title: 'Clone Graph', url: 'https://leetcode.com/problems/clone-graph/', difficulty: 'Medium' },
      { title: 'Course Schedule', url: 'https://leetcode.com/problems/course-schedule/', difficulty: 'Medium' },
    ],
    'Strings': [
      { title: 'Valid Anagram', url: 'https://leetcode.com/problems/valid-anagram/', difficulty: 'Easy' },
      { title: 'Longest Palindromic Substring', url: 'https://leetcode.com/problems/longest-palindromic-substring/', difficulty: 'Medium' },
      { title: 'Encode and Decode Strings', url: 'https://leetcode.com/problems/encode-and-decode-strings/', difficulty: 'Medium' },
    ],
    'SQL': [
      { title: 'Combine Two Tables', url: 'https://leetcode.com/problems/combine-two-tables/', difficulty: 'Easy' },
      { title: 'Employees Earning More Than Managers', url: 'https://leetcode.com/problems/employees-earning-more-than-their-managers/', difficulty: 'Easy' },
      { title: 'Department Top Three Salaries', url: 'https://leetcode.com/problems/department-top-three-salaries/', difficulty: 'Hard' },
    ],
  };

  try {
    const weakResult = await pool.query(
      `SELECT t.name FROM topics t
       LEFT JOIN user_topics ut ON t.id = ut.topic_id AND ut.user_id = $1
       WHERE COALESCE(ut.status, 'learning') IN ('learning', 'needs_review')
       ORDER BY RANDOM() LIMIT 1`,
      [req.userId]
    );

    const topicName = weakResult.rows[0]?.name || 'Arrays & Hashing';
    const problems = problemMap[topicName] || problemMap['Arrays & Hashing'];
    const problem = problems[Math.floor(Math.random() * problems.length)];

    res.json({ topic: topicName, ...problem });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/topics/leetcode-log
router.post('/leetcode-log', authMiddleware, async (req, res) => {
  const { problem_url, problem_title, difficulty, completed } = req.body;
  try {
    await pool.query(
      `INSERT INTO leetcode_log (user_id, problem_url, problem_title, difficulty, completed)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.userId, problem_url, problem_title, difficulty, completed]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;