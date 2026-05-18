import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import styles from './History.module.css';

interface Question {
  id: number;
  topic: string;
  question_text: string;
  difficulty: string;
  user_answer: string | null;
  ai_feedback: string | null;
  created_at: string;
}

export default function History() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    api.get('/questions/history').then(r => setQuestions(r.data));
  }, []);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>DD</span>
          <span className={styles.logoText}>DevDrill</span>
        </div>
        <nav className={styles.nav}>
          <button className={styles.navItem} onClick={() => navigate('/dashboard')}>⌂ Dashboard</button>
          <button className={styles.navItem} onClick={() => navigate('/drill')}>⚡ Drill</button>
          <button className={styles.navItem} onClick={() => navigate('/topics')}>◎ Topics</button>
          <button className={`${styles.navItem} ${styles.navActive}`}>≡ History</button>
        </nav>
      </aside>

      <main className={styles.main}>
        <h1 className={styles.title}>History</h1>
        <p className={styles.subtitle}>Your last 20 questions. Review your answers and feedback.</p>

        {questions.length === 0 ? (
          <div className={styles.empty}>
            <p>No questions yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/drill')}>
              Start drilling →
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {questions.map(q => {
              const feedback = q.ai_feedback ? JSON.parse(q.ai_feedback) : null;
              const isOpen = expanded === q.id;
              return (
                <div key={q.id} className={styles.item} onClick={() => setExpanded(isOpen ? null : q.id)}>
                  <div className={styles.itemHeader}>
                    <div className={styles.itemMeta}>
                      <span className={`tag tag-${q.difficulty}`}>{q.difficulty}</span>
                      <span className={styles.itemTopic}>{q.topic}</span>
                      {feedback && (
                        <span className={styles.score} data-score={Math.round(feedback.score / 3)}>
                          {feedback.score}/10
                        </span>
                      )}
                    </div>
                    <span className={styles.itemDate}>
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={styles.itemQ}>{q.question_text}</p>

                  {isOpen && (
                    <div className={styles.itemExpanded}>
                      {q.user_answer && (
                        <div className={styles.expandSection}>
                          <span className={styles.expandLabel}>Your answer</span>
                          <p>{q.user_answer}</p>
                        </div>
                      )}
                      {feedback && (
                        <div className={styles.expandSection}>
                          <span className={styles.expandLabel}>AI Feedback</span>
                          <p>{feedback.feedback}</p>
                          {feedback.strong && <p className={styles.strong}>✓ {feedback.strong}</p>}
                          {feedback.missed && <p className={styles.missed}>✗ {feedback.missed}</p>}
                        </div>
                      )}
                      {!q.user_answer && (
                        <p className={styles.noAnswer}>No answer submitted for this question.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}