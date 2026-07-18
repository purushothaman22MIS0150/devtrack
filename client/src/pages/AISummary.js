import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const AISummary = () => {
  const [summary, setSummary] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/weekly-summary');
      setSummary(res.data.summary);
      setStats(res.data.stats);
    } catch (err) {
      setSummary('Failed to generate summary. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>⚡ DevTrack</h2>
        <nav>
          <p style={styles.navItem} onClick={() => navigate('/dashboard')}>🏠 Dashboard</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>📁 Projects</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>✅ Tasks</p>
          <p style={styles.navItem} onClick={() => navigate('/timelogs')}>⏱ Time Logs</p>
          <p style={styles.navItem} onClick={() => navigate('/analytics')}>📊 Analytics</p>
          <p style={{ ...styles.navItem, ...styles.activeNav }}>🤖 AI Summary</p>
        </nav>
        <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <h1 style={styles.pageTitle}>🤖 AI Weekly Summary</h1>
        <p style={styles.subtitle}>Get an AI-powered analysis of your productivity this week</p>

        {/* Generate Button */}
        <button style={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
          {loading ? '⏳ Generating...' : '✨ Generate My Weekly Summary'}
        </button>

        {/* Stats Row */}
        {stats && (
          <div style={styles.statsRow}>
            <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              <h3 style={styles.statNum}>{stats.totalTasks}</h3>
              <p style={styles.statLabel}>Tasks This Week</p>
            </div>
            <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
              <h3 style={styles.statNum}>{stats.completedTasks}</h3>
              <p style={styles.statLabel}>Completed</p>
            </div>
            <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
              <h3 style={styles.statNum}>{stats.totalHours}h</h3>
              <p style={styles.statLabel}>Hours Logged</p>
            </div>
            <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
              <h3 style={styles.statNum}>{stats.sessions}</h3>
              <p style={styles.statLabel}>Work Sessions</p>
            </div>
          </div>
        )}

        {/* AI Summary Card */}
        {summary && (
          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <span style={styles.aiIcon}>🤖</span>
              <h3 style={styles.summaryTitle}>Your Weekly Report</h3>
            </div>
            <div style={styles.summaryContent}>
              {summary.split('\n').map((line, index) => (
                <p key={index} style={line.startsWith('#') || /^\d\./.test(line) ? styles.summaryHeading : styles.summaryText}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!summary && !loading && (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>🤖</p>
            <p style={styles.emptyText}>Click the button above to generate your personalized weekly productivity summary powered by AI.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif' },
  sidebar: { width: '240px', backgroundColor: '#1e1b4b', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  logo: { color: '#fff', fontSize: '22px', marginBottom: '40px' },
  navItem: { color: '#a5b4fc', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', marginBottom: '5px', fontSize: '15px' },
  activeNav: { backgroundColor: '#4f46e5', color: '#fff' },
  logoutBtn: { backgroundColor: '#f5576c', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  main: { flex: 1, padding: '40px' },
  pageTitle: { fontSize: '26px', fontWeight: 'bold', color: '#1e1b4b', marginBottom: '8px' },
  subtitle: { color: '#666', marginBottom: '30px', fontSize: '15px' },
  generateBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '14px 30px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginBottom: '30px', boxShadow: '0 4px 15px rgba(79,70,229,0.4)' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
  statCard: { flex: 1, padding: '20px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  statNum: { fontSize: '32px', margin: 0 },
  statLabel: { fontSize: '13px', marginTop: '5px', opacity: 0.9 },
  summaryCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderLeft: '5px solid #4f46e5' },
  summaryHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  aiIcon: { fontSize: '32px' },
  summaryTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1e1b4b', margin: 0 },
  summaryContent: { lineHeight: '1.8' },
  summaryHeading: { fontWeight: 'bold', color: '#1e1b4b', marginTop: '15px', fontSize: '15px' },
  summaryText: { color: '#444', fontSize: '14px', margin: '4px 0' },
  emptyState: { textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  emptyIcon: { fontSize: '64px', marginBottom: '20px' },
  emptyText: { color: '#666', fontSize: '15px', maxWidth: '400px', margin: '0 auto' }
};

export default AISummary;