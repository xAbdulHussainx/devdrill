import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import styles from './Topics.module.css';

interface Topic {
  id: number;
  name: string;
  category: string;
  status: 'learning' | 'confident' | 'needs_review';
}

const STATUS_OPTIONS = [
  { value: 'learning', label: 'Learning', color: 'var(--accent)' },
  { value: 'confident', label: 'Confident', color: 'var(--green)' },
  { value: 'needs_review', label: 'Needs Review', color: 'var(--yellow)' },
] as const;

export default function Topics() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    api.get('/topics').then(r => setTopics(r.data));
  }, []);

  const updateStatus = async (topicId: number, status: string) => {
    setUpdating(topicId);
    try {
      await api.patch(`/topics/${topicId}/status`, { status });
      setTopics(prev => prev.map(t => t.id === topicId ? { ...t, status: status as Topic['status'] } : t));
    } finally {
      setUpdating(null);
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
          <button className={styles.navItem} onClick={() => navigate('/drill')}>⚡ Drill</button>
          <button className={`${styles.navItem} ${styles.navActive}`}>◎ Topics</button>
          <button className={styles.navItem} onClick={() => navigate('/history')}>≡ History</button>
        </nav>
      </aside>

      <main className={styles.main}>
        <h1 className={styles.title}>Topics</h1>
        <p className={styles.subtitle}>Track your mastery level across every topic. Be honest — it helps the drill engine prioritize.</p>

        <div className={styles.legend}>
          {STATUS_OPTIONS.map(s => (
            <div key={s.value} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>

        {categories.map(cat => (
          <div key={cat} className={styles.category}>
            <h2 className={styles.catTitle}>{cat}</h2>
            <div className={styles.topicGrid}>
              {topics.filter(t => t.category === cat).map(topic => (
                <div key={topic.id} className={`${styles.topicCard} ${styles[`status_${topic.status}`]}`}>
                  <p className={styles.topicName}>{topic.name}</p>
                  <div className={styles.statusBtns}>
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        className={`${styles.statusBtn} ${topic.status === s.value ? styles.statusBtnActive : ''}`}
                        data-status={s.value}
                        onClick={() => updateStatus(topic.id, s.value)}
                        disabled={updating === topic.id}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}