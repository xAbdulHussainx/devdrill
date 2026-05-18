import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      username VARCHAR(100) NOT NULL,
      streak INTEGER DEFAULT 0,
      last_active DATE,
      reminder_time TIME,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      category VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_topics (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      topic_id INTEGER REFERENCES topics(id),
      status VARCHAR(20) DEFAULT 'learning' CHECK (status IN ('learning', 'confident', 'needs_review')),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, topic_id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      topic VARCHAR(100) NOT NULL,
      question_text TEXT NOT NULL,
      user_answer TEXT,
      ai_feedback TEXT,
      difficulty VARCHAR(20) DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leetcode_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      problem_url TEXT,
      problem_title VARCHAR(255),
      difficulty VARCHAR(20),
      completed BOOLEAN DEFAULT false,
      logged_at TIMESTAMP DEFAULT NOW()
    );

    INSERT INTO topics (name, category) VALUES
  ('System Design', 'Concepts'),
  ('Object Oriented Programming', 'Concepts'),
  ('SQL', 'Database'),
  ('Behavioral', 'Soft Skills'),
  ('Cloud & DevOps', 'Cloud'),
  ('React & Frontend', 'Frontend'),
  ('APIs & Backend', 'Backend'),
  ('Arrays & Hashing', 'DSA'),
  ('Two Pointers', 'DSA'),
  ('Sliding Window', 'DSA'),
  ('Binary Search', 'DSA'),
  ('BFS / DFS', 'DSA'),
  ('Strings', 'DSA')
ON CONFLICT (name) DO NOTHING;
  `);

  console.log('✅ Database initialized');
};