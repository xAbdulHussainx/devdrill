import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import styles from './Dashboard.module.css';

interface LeetSuggestion {
  topic: string;
  title: string;
  url: string;
  difficulty: string;
}

interface RecentQuestion {
  id: number;
  topic: string;
  question_text: string;
  difficulty: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState<LeetSuggestion | null>(null);
  const [recent, setRecent] = useState<RecentQuestion[]>([]);
  const [topicStats, setTopicStats] = useState({ learning: 0, confident: 0, needs_review: 0 });

  useEffect(() => {
    api.get('/topics/leetcode-suggestion').then(r => setSuggestion(r.data));
    api.get('/questions/history').then(r => setRecent(r.data.slice(0, 3)));
    api.get('/topics').then(r => {
      const stats = { learning: 0, confident: 0, needs_review: 0 };
      r.data.forEach((t: any) => {
        if (stats[t.status as keyof typeof stats] !== undefined) {
          stats[t.status as keyof typeof stats]++;
        }
      });
      setTopicStats(stats);
    });
  }, []);

  const totalTopics = topicStats.learning + topicStats.confident + topicStats.needs_review;
  const progress = totalTopics > 0 ? Math.round((topicStats.confident / totalTopics) * 100) : 0;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>DD</span>
          <span className={styles.logoText}>DevDrill</span>
        </div>
        <nav className={styles.nav}>
          <button className={`${styles.navItem} ${styles.navActive}`}>
            <span className={styles.navIcon}>⌂</span> Dashboard
          </button>
          <button className={styles.navItem} onClick={() => navigate('/drill')}>
            <span className={styles.navIcon}>⚡</span> Drill
          </button>
          <button className={styles.navItem} onClick={() => navigate('/topics')}>
            <span className={styles.navIcon}>◎</span> Topics
          </button>
          <button className={styles.navItem} onClick={() => navigate('/history')}>
            <span className={styles.navIcon}>≡</span> History
          </button>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div className={styles.userName}>{user?.username}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button className={`btn btn-ghost ${styles.logoutBtn}`} onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Good {getTimeOfDay()}, {user?.username}.</h1>
            <p className={styles.subGreeting}>Ready to drill?</p>
          </div>
          <div className={styles.streak}>
            <span className={styles.streakFlame}>🔥</span>
            <span className={styles.streakNum}>{user?.streak ?? 0}</span>
            <span className={styles.streakLabel}>day streak</span>
          </div>
        </header>

        <div className={styles.grid}>
          <div className={styles.drillCard} onClick={() => navigate('/drill')}>
            <div className={styles.drillCardInner}>
              <p className={styles.drillLabel}>Start drilling</p>
              <h2 className={styles.drillTitle}>New Question →</h2>
              <p className={styles.drillSub}>AI-generated from your weak topics</p>
            </div>
            <div className={styles.drillGlow} />
          </div>

          <div className="card">
            <p className={styles.cardLabel}>Topic mastery</p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <p className={styles.progressPct}>{progress}% confident</p>
            <div className={styles.progressBreakdown}>
              <span className="tag tag-confident">{topicStats.confident} confident</span>
              <span className="tag tag-needs-review">{topicStats.needs_review} review</span>
              <span className="tag tag-learning">{topicStats.learning} learning</span>
            </div>
          </div>

          {suggestion && (
            <div className="card">
              <p className={styles.cardLabel}>Today's LeetCode</p>
              <div className={styles.leetRow}>
                <span className={`tag tag-${suggestion.difficulty.toLowerCase()}`}>
                  {suggestion.difficulty}
                </span>
                <span className={styles.leetTopic}>from: {suggestion.topic}</span>
              </div>
              <p className={styles.leetTitle}>{suggestion.title}</p>
              <a
                href={suggestion.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
                style={{ marginTop: 12 }}
              >
                Open on LeetCode ↗
              </a>
            </div>
          )}

          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className={styles.recentHeader}>
              <p className={styles.cardLabel}>Recent questions</p>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/history')}
                style={{ fontSize: '0.8rem', padding: '5px 12px' }}
              >
                View all
              </button>
            </div>
            {recent.length === 0 ? (
              <p className={styles.empty}>No questions yet. Hit "Drill" to start.</p>
            ) : (
              <div className={styles.recentList}>
                {recent.map(q => (
                  <div key={q.id} className={styles.recentItem}>
                    <div className={styles.recentMeta}>
                      <span className={`tag tag-${q.difficulty}`}>{q.difficulty}</span>
                      <span className={styles.recentTopic}>{q.topic}</span>
                      <span className={styles.recentDate}>
                        {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={styles.recentQ}>{q.question_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}