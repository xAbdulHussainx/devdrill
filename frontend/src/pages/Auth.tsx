import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './Auth.module.css';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, username);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.logo}>DD</span>
          <span className={styles.logoText}>DevDrill</span>
        </div>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Ship the interview.<br />
            <span className={styles.heroAccent}>Daily.</span>
          </h1>
          <p className={styles.heroSub}>
            AI-powered CS interview prep. Track your topics,
            practice with real questions, build the habit.
          </p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>15+</span>
            <span className={styles.statLabel}>Topics</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>AI</span>
            <span className={styles.statLabel}>Feedback</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>∞</span>
            <span className={styles.statLabel}>Questions</span>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.form}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
              onClick={() => setMode('login')}
            >
              Sign in
            </button>
            <button
              className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
              onClick={() => setMode('register')}
            >
              Create account
            </button>
          </div>

          <div className={styles.fields}>
            {mode === 'register' && (
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <input
                  type="text"
                  placeholder="abduldev"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            )}
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={`btn btn-primary ${styles.submitBtn}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign in →' : 'Get started →'}
          </button>
        </div>
      </div>
    </div>
  );
}