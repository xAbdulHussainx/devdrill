console.log('GEMINI KEY:', process.env.GEMINI_API_KEY);
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/index.js';
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import topicRoutes from './routes/topics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://devdrill.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/topics', topicRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'DevDrill' }));

// Start
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 DevDrill backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});