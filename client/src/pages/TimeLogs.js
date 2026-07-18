import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

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
    } catch (err) { console.error(err); }
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
          {logs.length === 0 ? (
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

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif' },
  sidebar: { width: '240px', backgroundColor: '#1e1b4b', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  logo: { color: '#fff', fontSize: '22px', marginBottom: '40px' },
  navItem: { color: '#a5b4fc', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', marginBottom: '5px', fontSize: '15px' },
  activeNav: { backgroundColor: '#4f46e5', color: '#fff' },
  logoutBtn: { backgroundColor: '#f5576c', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  main: { flex: 1, padding: '40px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  pageTitle: { fontSize: '26px', fontWeight: 'bold', color: '#1e1b4b' },
  addBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
  statCard: { flex: 1, padding: '20px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  statNum: { fontSize: '32px', margin: 0 },
  statLabel: { fontSize: '13px', marginTop: '5px', opacity: 0.9 },
  timerCard: { backgroundColor: '#1e1b4b', borderRadius: '16px', padding: '30px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  timerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  timerTitle: { color: '#a5b4fc', fontSize: '16px', margin: 0 },
  runningBadge: { backgroundColor: '#10b981', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', animation: 'pulse 1s infinite' },
  timerDisplay: { fontSize: '64px', fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: '4px', marginBottom: '25px', fontFamily: 'monospace' },
  timerControls: { display: 'flex', flexDirection: 'column', gap: '10px' },
  timerButtons: { display: 'flex', gap: '10px' },
  startBtn: { flex: 1, backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  stopBtn: { flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  select: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #374151', fontSize: '14px', backgroundColor: '#2d2b5e', color: '#fff', boxSizing: 'border-box' },
  selectLight: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #374151', fontSize: '14px', backgroundColor: '#2d2b5e', color: '#fff', boxSizing: 'border-box' },
  inputLight: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  formCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  formTitle: { color: '#1e1b4b', marginBottom: '15px' },
  formRow: { display: 'flex', gap: '10px' },
  formButtons: { display: 'flex', gap: '10px' },
  submitBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#e5e7eb', color: '#333', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
  tableCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' },
  tableTitle: { color: '#1e1b4b', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f8f9ff' },
  th: { padding: '12px 15px', textAlign: 'left', color: '#4f46e5', fontWeight: 'bold', fontSize: '13px', borderBottom: '2px solid #ede9fe' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 15px', fontSize: '14px', color: '#444' },
  hoursBadge: { backgroundColor: '#ede9fe', color: '#4f46e5', padding: '3px 10px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  empty: { color: '#666', textAlign: 'center', padding: '30px' }
};

export default TimeLogs;