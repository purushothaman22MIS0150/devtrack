import React, { useState } from 'react';
import api from '../utils/api';

const AIHub = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);

  const getLogs = async () => {
    try {
      const res = await api.get('/timelogs');
      return res.data;
    } catch (err) {
      return [];
    }
  };

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setQuestion('');
    setError('');
    setChat(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const logs = await getLogs();
      const res = await api.post('/ai/chat', { question: q, logs });
      setChat(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.widget}>
      <h2 style={styles.title}>💬 Ask DevTrack</h2>
      <p style={styles.subtitle}>Ask anything about your projects, tasks and time logs</p>

      <div style={styles.body}>
        {chat.length === 0 && (
          <p style={styles.hint}>
            Try: "Which tasks are overdue?" or "How many hours did I log this week?"
          </p>
        )}
        {chat.map((m, i) => (
          <div key={i} style={m.role === 'user' ? styles.userMsg : styles.aiMsg}>
            {m.text}
          </div>
        ))}
        {loading && <p style={styles.hint}>🤖 Thinking...</p>}
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.askRow}>
          <input
            style={styles.input}
            type="text"
            placeholder="Ask about your projects, tasks or time logs"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAsk(); }}
          />
          <button style={styles.btn} onClick={handleAsk} disabled={loading || !question.trim()}>
            Ask
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  widget: { backgroundColor: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '25px', marginBottom: '30px', boxShadow: '0 8px 25px rgba(0,0,0,0.25)' },
  title: { color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 },
  subtitle: { color: '#a0a3c4', fontSize: '13px', marginTop: '4px', marginBottom: '16px' },
  body: { borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' },
  btn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  askRow: { display: 'flex', gap: '10px', marginTop: '12px' },
  input: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', outline: 'none' },
  userMsg: { backgroundColor: 'rgba(99,102,241,0.25)', color: '#fff', borderRadius: '10px', padding: '10px 14px', margin: '8px 0 8px 60px', fontSize: '14px' },
  aiMsg: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', borderRadius: '10px', padding: '10px 14px', margin: '8px 60px 8px 0', fontSize: '14px', lineHeight: '1.6' },
  hint: { color: '#a0a3c4', fontSize: '13px', margin: '8px 0' },
  error: { color: '#fca5a5', fontSize: '13px', marginTop: '12px' },
};

export default AIHub;