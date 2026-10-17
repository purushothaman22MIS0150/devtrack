import React, { useState } from 'react';
import api from '../utils/api';

const TABS = [
  { id: 'ask', label: '💬 Ask DevTrack' },
  { id: 'standup', label: '🗣 Daily Standup' },
];

const AIHub = () => {
  const [tab, setTab] = useState('ask');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [standup, setStandup] = useState(null);
  const [copied, setCopied] = useState(false);

  const getLogs = async () => {
    try {
      const res = await api.get('/timelogs');
      return res.data;
    } catch (err) {
      return [];
    }
  };

  const run = async (fn) => {
    setLoading(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleAsk = () => {
    const q = question.trim();
    if (!q || loading) return;
    setQuestion('');
    setChat(prev => [...prev, { role: 'user', text: q }]);
    run(async () => {
      const logs = await getLogs();
      const res = await api.post('/ai/chat', { question: q, logs });
      setChat(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    });
  };

  const handleStandup = () => {
    setCopied(false);
    run(async () => {
      const logs = await getLogs();
      const res = await api.post('/ai/standup', { logs });
      setStandup(res.data);
    });
  };

  const copyStandup = async () => {
    if (!standup) return;
    const text = `Yesterday: ${standup.yesterday}\nToday: ${standup.today}\nBlockers: ${standup.blockers}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (err) {
      setError('Could not copy. Select the text and copy it manually.');
    }
  };

  return (
    <div style={styles.widget}>
      <h2 style={styles.title}>🧠 AI Assistant</h2>
      <p style={styles.subtitle}>Ask questions about your work and get a ready-made standup</p>

      <div style={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            style={{ ...styles.tab, ...(tab === t.id ? styles.tabActive : {}) }}
            onClick={() => { setTab(t.id); setError(''); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={styles.body}>
        {tab === 'ask' && (
          <div>
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
        )}

        {tab === 'standup' && (
          <div>
            <button style={styles.btn} onClick={handleStandup} disabled={loading}>
              {loading ? '⏳ Writing...' : '✨ Write my standup'}
            </button>
            {standup && (
              <div style={styles.card}>
                <p style={styles.label}>Yesterday</p>
                <p style={styles.text}>{standup.yesterday}</p>
                <p style={styles.label}>Today</p>
                <p style={styles.text}>{standup.today}</p>
                <p style={styles.label}>Blockers</p>
                <p style={styles.text}>{standup.blockers}</p>
                <button style={styles.copyBtn} onClick={copyStandup}>
                  {copied ? '✅ Copied' : '📋 Copy'}
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

const styles = {
  widget: { backgroundColor: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '25px', marginBottom: '30px', boxShadow: '0 8px 25px rgba(0,0,0,0.25)' },
  title: { color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 },
  subtitle: { color: '#a0a3c4', fontSize: '13px', marginTop: '4px', marginBottom: '16px' },
  tabs: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
  tab: { backgroundColor: 'rgba(255,255,255,0.08)', color: '#c4c8ff', border: '1px solid rgba(255,255,255,0.12)', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' },
  tabActive: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: '1px solid transparent' },
  body: { borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' },
  btn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  copyBtn: { backgroundColor: 'rgba(255,255,255,0.12)', color: '#e8e8f0', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginTop: '10px' },
  askRow: { display: 'flex', gap: '10px', marginTop: '12px' },
  input: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', outline: 'none' },
  userMsg: { backgroundColor: 'rgba(99,102,241,0.25)', color: '#fff', borderRadius: '10px', padding: '10px 14px', margin: '8px 0 8px 60px', fontSize: '14px' },
  aiMsg: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', borderRadius: '10px', padding: '10px 14px', margin: '8px 60px 8px 0', fontSize: '14px', lineHeight: '1.6' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '15px 18px', marginTop: '12px' },
  label: { color: '#a5b4fc', fontWeight: 'bold', fontSize: '13px', margin: '8px 0 2px 0' },
  text: { color: '#e2e8f0', fontSize: '14px', margin: '2px 0', lineHeight: '1.6' },
  hint: { color: '#a0a3c4', fontSize: '13px', margin: '8px 0' },
  error: { color: '#fca5a5', fontSize: '13px', marginTop: '12px' },
};

export default AIHub;