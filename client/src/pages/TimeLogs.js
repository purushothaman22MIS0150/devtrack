import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const TimeLogs = () => {
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [hours, setHours] = useState('');
  const [logDate, setLogDate] = useState('');
  const [note, setNote] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [timerTasks, setTimerTasks] = useState([]);
    const [loading, setLoading] = useState(true);

  const {
    timerRunning, setTimerRunning,
    timerSeconds, setTimerSeconds,
    timerTaskId, setTimerTaskId,
    timerProjectId, setTimerProjectId,
    timerNote, setTimerNote,
    formatTime, logout
  } = useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) fetchTasks(selectedProject);
  }, [selectedProject]);

  useEffect(() => {
    if (timerProjectId) fetchTimerTasks(timerProjectId);
  }, [timerProjectId]);

    const fetchLogs = async () => {
    try {
      const res = await api.get('/timelogs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTasks = async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTimerTasks = async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      setTimerTasks(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/timelogs', { task_id: taskId, hours, log_date: logDate, note });
      setTaskId(''); setHours(''); setLogDate(''); setNote(''); setSelectedProject('');
      setShowForm(false);
      fetchLogs();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/timelogs/${id}`);
      fetchLogs();
    } catch (err) { console.error(err); }
  };

  const handleStartTimer = () => {
    if (!timerTaskId) return alert('Please select a task first');
    setTimerSeconds(0);
    setTimerRunning(true);
  };

  const handleStopTimer = async () => {
    setTimerRunning(false);
    const hoursLogged = (timerSeconds / 3600).toFixed(2);
    const today = new Date().toLocaleDateString('en-CA');
    try {
      await api.post('/timelogs', {
        task_id: timerTaskId,
        hours: hoursLogged,
        log_date: today,
        note: timerNote || `Timed session: ${formatTime(timerSeconds)}`
      });
      setTimerSeconds(0);
      setTimerTaskId('');
      setTimerProjectId('');
      setTimerNote('');
      fetchLogs();
      alert(`✅ Logged ${hoursLogged} hours successfully!`);
    } catch (err) { console.error(err); }
  };

  const totalHours = logs.reduce((sum, log) => sum + parseFloat(log.hours), 0).toFixed(1);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>⚡ DevTrack</h2>
        <nav>
          <p style={styles.navItem} onClick={() => navigate('/dashboard')}>🏠 Dashboard</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>📁 Projects</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>✅ Tasks</p>
          <p style={{ ...styles.navItem, ...styles.activeNav }}>⏱ Time Logs</p>
          <p style={styles.navItem} onClick={() => navigate('/analytics')}>📊 Analytics</p>
                    <p style={styles.navItem} onClick={() => navigate('/profile')}>👤 Profile</p>
        </nav>
        <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>🚪 Logout</button>
      </div>

      <div style={styles.main}>
        <div style={styles.topBar}>
          <h1 style={styles.pageTitle}>⏱ Time Logs</h1>
          <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>+ Manual Log</button>
        </div>

        <div style={styles.statsRow}>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            <h3 style={styles.statNum}>{totalHours}</h3>
            <p style={styles.statLabel}>Total Hours Logged</p>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
            <h3 style={styles.statNum}>{logs.length}</h3>
            <p style={styles.statLabel}>Total Entries</p>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
            <h3 style={styles.statNum}>{logs.length > 0 ? (totalHours / logs.length).toFixed(1) : 0}</h3>
            <p style={styles.statLabel}>Avg Hours / Entry</p>
          </div>
        </div>

        {/* Live Timer */}
        <div style={styles.timerCard}>
          <div style={styles.timerHeader}>
            <h3 style={styles.timerTitle}>⏱ Live Timer</h3>
            {timerRunning && <span style={styles.runningBadge}>● RUNNING</span>}
          </div>
          <div style={styles.timerDisplay}>{formatTime(timerSeconds)}</div>
          <div style={styles.timerControls}>
            <select style={styles.select} value={timerProjectId} onChange={e => setTimerProjectId(e.target.value)} disabled={timerRunning}>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <select style={styles.select} value={timerTaskId} onChange={e => setTimerTaskId(e.target.value)} disabled={timerRunning}>
              <option value="">Select Task</option>
              {timerTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <input style={styles.input} type="text" placeholder="Note (optional)" value={timerNote} onChange={e => setTimerNote(e.target.value)} disabled={timerRunning} />
            <div style={styles.timerButtons}>
              {!timerRunning ? (
                <button style={styles.startBtn} onClick={handleStartTimer}>▶ Start</button>
              ) : (
                <button style={styles.stopBtn} onClick={handleStopTimer}>⏹ Stop & Save</button>
              )}
            </div>
          </div>
        </div>

        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Manual Time Log</h3>
            <form onSubmit={handleCreate}>
              <select style={styles.selectLight} value={selectedProject} onChange={e => setSelectedProject(e.target.value)} required>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <select style={styles.selectLight} value={taskId} onChange={e => setTaskId(e.target.value)} required>
                <option value="">Select Task</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <div style={styles.formRow}>
                <input style={styles.inputLight} type="number" placeholder="Hours (e.g. 2.5)" step="0.5" min="0.5" max="24" value={hours} onChange={e => setHours(e.target.value)} required />
                <input style={styles.inputLight} type="date" value={logDate} onChange={e => setLogDate(e.target.value)} required />
              </div>
              <input style={styles.inputLight} type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
              <div style={styles.formButtons}>
                <button style={styles.submitBtn} type="submit">Save Log</button>
                <button style={styles.cancelBtn} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div style={styles.tableCard}>
          <h3 style={styles.tableTitle}>Recent Logs</h3>
                    {loading ? (
            <Spinner text="Loading logs..." />
          ) : logs.length === 0 ? (
            <p style={styles.empty}>No time logs yet. Start the timer or add a manual log!</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Task</th>
                  <th style={styles.th}>Project</th>
                  <th style={styles.th}>Hours</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Note</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={styles.tableRow}>
                    <td style={styles.td}>{log.task_title}</td>
                    <td style={styles.td}>{log.project_title}</td>
                    <td style={styles.td}><span style={styles.hoursBadge}>{log.hours}h</span></td>
                    <td style={styles.td}>{new Date(log.log_date).toDateString()}</td>
                    <td style={styles.td}>{log.note || '-'}</td>
                    <td style={styles.td}>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(log.id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const glass = {
  backgroundColor: 'rgba(255, 255, 255, 0.07)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' },
  sidebar: { ...glass, width: '240px', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' },
  logo: { color: '#fff', fontSize: '22px', marginBottom: '40px' },
  navItem: { color: '#c4c8ff', padding: '12px 15px', borderRadius: '10px', cursor: 'pointer', marginBottom: '5px', fontSize: '15px', transition: 'all 0.2s ease' },
  activeNav: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' },
  logoutBtn: { background: 'linear-gradient(135deg, #f5576c, #f093fb)', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  main: { flex: 1, padding: '40px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  pageTitle: { fontSize: '26px', fontWeight: '600', color: '#fff' },
  addBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 15px rgba(99,102,241,0.4)' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
  statCard: { flex: 1, padding: '20px', borderRadius: '16px', color: '#fff', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' },
  statNum: { fontSize: '32px', margin: 0, fontWeight: '600' },
  statLabel: { fontSize: '13px', marginTop: '5px', opacity: 0.9 },
  timerCard: { ...glass, borderRadius: '20px', padding: '30px', marginBottom: '30px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' },
  timerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  timerTitle: { color: '#c4c8ff', fontSize: '16px', margin: 0 },
  runningBadge: { backgroundColor: '#10b981', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', animation: 'pulse 1s infinite' },
  timerDisplay: { fontSize: '64px', fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: '4px', marginBottom: '25px', fontFamily: 'monospace', textShadow: '0 0 20px rgba(139,92,246,0.6)' },
  timerControls: { display: 'flex', flexDirection: 'column', gap: '10px' },
  timerButtons: { display: 'flex', gap: '10px' },
  startBtn: { flex: 1, backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  stopBtn: { flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', fontSize: '14px', backgroundColor: '#25234f', color: '#fff', boxSizing: 'border-box', outline: 'none' },
  selectLight: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', fontSize: '14px', backgroundColor: '#25234f', color: '#fff', boxSizing: 'border-box', outline: 'none' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', fontSize: '14px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', boxSizing: 'border-box', outline: 'none' },
  inputLight: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', fontSize: '14px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', boxSizing: 'border-box', outline: 'none' },
  formCard: { ...glass, padding: '25px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 8px 25px rgba(0,0,0,0.25)' },
  formTitle: { color: '#fff', marginBottom: '15px' },
  formRow: { display: 'flex', gap: '10px' },
  formButtons: { display: 'flex', gap: '10px' },
  submitBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.12)', color: '#e8e8f0', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  tableCard: { ...glass, borderRadius: '16px', padding: '25px', boxShadow: '0 8px 25px rgba(0,0,0,0.25)' },
  tableTitle: { color: '#fff', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: 'rgba(255,255,255,0.06)' },
  th: { padding: '12px 15px', textAlign: 'left', color: '#c4c8ff', fontWeight: 'bold', fontSize: '13px', borderBottom: '2px solid rgba(255,255,255,0.12)' },
  tableRow: { borderBottom: '1px solid rgba(255,255,255,0.08)' },
  td: { padding: '12px 15px', fontSize: '14px', color: '#e0e2f5' },
  hoursBadge: { backgroundColor: 'rgba(99,102,241,0.3)', color: '#c4c8ff', padding: '3px 10px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px' },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' },
  empty: { color: '#a0a3c4', textAlign: 'center', padding: '30px' }
};

export default TimeLogs;