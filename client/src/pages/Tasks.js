import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import PomodoroTimer from '../components/PomodoroTimer';

const Tasks = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);

  // AI suggestion state
  const [showAi, setShowAi] = useState(false);
  const [goal, setGoal] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [adding, setAdding] = useState(false);

  const navigate = useNavigate();

  const fetchProject = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      const found = res.data.find(p => p.id === parseInt(projectId));
      setProject(found);
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
    fetchProject();
  }, [fetchTasks, fetchProject]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/tasks`, { title, description, priority, deadline });
      setTitle(''); setDescription(''); setPriority('Medium'); setDeadline('');
      setShowForm(false);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await api.put(`/projects/tasks/${task.id}`, { ...task, status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // ---- AI suggestions ----
  const handleSuggest = async () => {
    setAiLoading(true);
    setAiError('');
    setSuggestions([]);
    try {
      const res = await api.post(`/projects/${projectId}/ai-tasks`, { goal });
      setSuggestions(res.data.tasks.map(t => ({ ...t, selected: true })));
    } catch (err) {
      console.error(err);
      setAiError(err.response?.data?.message || 'Could not get suggestions. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleSuggestion = (index) => {
    setSuggestions(prev => prev.map((s, i) => i === index ? { ...s, selected: !s.selected } : s));
  };

  const handleAddSelected = async () => {
    const chosen = suggestions.filter(s => s.selected);
    if (chosen.length === 0) return;
    setAdding(true);
    try {
      for (const s of chosen) {
        await api.post(`/projects/${projectId}/tasks`, {
          title: s.title,
          description: s.description,
          priority: s.priority,
          deadline: s.deadline,
        });
      }
      setSuggestions([]);
      setGoal('');
      setShowAi(false);
      fetchTasks();
    } catch (err) {
      console.error(err);
      setAiError('Some tasks could not be added. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const columns = ['To Do', 'In Progress', 'Done'];
  const priorityColor = (p) => p === 'High' ? '#ef4444' : p === 'Medium' ? '#f59e0b' : '#10b981';
  const selectedCount = suggestions.filter(s => s.selected).length;

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>⚡ DevTrack</h2>
        <nav>
          <p style={styles.navItem} onClick={() => navigate('/dashboard')}>🏠 Dashboard</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>📁 Projects</p>
          <p style={{ ...styles.navItem, ...styles.activeNav }}>✅ Tasks</p>
          <p style={styles.navItem} onClick={() => navigate('/timelogs')}>⏱ Time Logs</p>
          <p style={styles.navItem} onClick={() => navigate('/analytics')}>📊 Analytics</p>
          <p style={styles.navItem} onClick={() => navigate('/profile')}>👤 Profile</p>
        </nav>
        <button style={styles.logoutBtn} onClick={() => { localStorage.clear(); navigate('/login'); }}>🚪 Logout</button>
      </div>

      <div style={styles.main}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>✅ Tasks</h1>
            {project && <p style={styles.projectName}>📁 {project.title}</p>}
          </div>
          <div style={styles.topButtons}>
            <button style={styles.backBtn} onClick={() => navigate('/projects')}>← Back</button>
            <button style={styles.aiBtn} onClick={() => setShowAi(!showAi)}>✨ Suggest with AI</button>
            <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>+ New Task</button>
          </div>
        </div>

        {showAi && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>✨ AI Task Suggestions</h3>
            <input
              style={styles.input}
              type="text"
              placeholder="Describe your goal (optional, e.g. build a login system)"
              value={goal}
              onChange={e => setGoal(e.target.value)}
            />
            <div style={styles.formButtons}>
              <button style={styles.submitBtn} onClick={handleSuggest} disabled={aiLoading}>
                {aiLoading ? 'Thinking...' : 'Generate tasks'}
              </button>
              <button style={styles.cancelBtn} onClick={() => setShowAi(false)}>Close</button>
            </div>

            {aiLoading && <p style={styles.aiHint}>The AI is planning your tasks. The first request can take up to a minute if the server was asleep.</p>}
            {aiError && <p style={styles.aiError}>{aiError}</p>}

            {suggestions.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                {suggestions.map((s, i) => (
                  <label key={i} style={styles.suggestionRow}>
                    <input type="checkbox" checked={s.selected} onChange={() => toggleSuggestion(i)} style={{ marginTop: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.taskHeader}>
                        <span style={styles.taskTitle}>{s.title}</span>
                        <span style={{ ...styles.priorityBadge, backgroundColor: priorityColor(s.priority) }}>{s.priority}</span>
                      </div>
                      <p style={styles.taskDesc}>{s.description}</p>
                      <p style={styles.taskDeadline}>📅 {new Date(s.deadline).toDateString()}</p>
                    </div>
                  </label>
                ))}
                <button style={styles.submitBtn} onClick={handleAddSelected} disabled={adding || selectedCount === 0}>
                  {adding ? 'Adding...' : `Add ${selectedCount} selected task${selectedCount === 1 ? '' : 's'}`}
                </button>
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Create New Task</h3>
            <form onSubmit={handleCreate}>
              <input style={styles.input} type="text" placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} required />
              <textarea style={styles.textarea} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              <div style={styles.formRow}>
                <select style={styles.select} value={priority} onChange={e => setPriority(e.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <input style={styles.input} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <div style={styles.formButtons}>
                <button style={styles.submitBtn} type="submit">Create</button>
                <button style={styles.cancelBtn} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading && <Spinner text="Loading tasks..." />}
        <div style={{ ...styles.kanban, display: loading ? 'none' : 'flex' }}>
          {columns.map(col => (
            <div key={col} style={styles.column}>
              <div style={styles.columnHeader}>
                <h3 style={styles.columnTitle}>{col}</h3>
                <span style={styles.columnCount}>{tasks.filter(t => t.status === col).length}</span>
              </div>
              {tasks.filter(t => t.status === col).map(task => (
                <div key={task.id} style={styles.taskCard}>
                  <div style={styles.taskHeader}>
                    <h4 style={styles.taskTitle}>{task.title}</h4>
                    <span style={{ ...styles.priorityBadge, backgroundColor: priorityColor(task.priority) }}>{task.priority}</span>
                  </div>
                  <p style={styles.taskDesc}>{task.description}</p>
                  {task.deadline && <p style={styles.taskDeadline}>📅 {new Date(task.deadline).toDateString()}</p>}
                  {col === 'In Progress' && <PomodoroTimer taskId={task.id} />}
                  <div style={styles.taskActions}>
                    {col !== 'To Do' && <button style={styles.moveBtn} onClick={() => handleStatusChange(task, col === 'In Progress' ? 'To Do' : 'In Progress')}>← Back</button>}
                    {col !== 'Done' && <button style={styles.moveBtn} onClick={() => handleStatusChange(task, col === 'To Do' ? 'In Progress' : 'Done')}>Next →</button>}
                    <button style={styles.deleteTaskBtn} onClick={() => handleDelete(task.id)}>🗑</button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === col).length === 0 && (
                <div style={styles.emptyCol}>No tasks</div>
              )}
            </div>
          ))}
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
  main: { flex: 1, padding: '40px', overflowX: 'auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  pageTitle: { fontSize: '26px', fontWeight: '600', color: '#fff', margin: 0 },
  projectName: { color: '#a0a3c4', fontSize: '14px', marginTop: '4px' },
  topButtons: { display: 'flex', gap: '10px' },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.12)', color: '#e8e8f0', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' },
  addBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 15px rgba(99,102,241,0.4)' },
  aiBtn: { background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 15px rgba(236,72,153,0.35)' },
  formCard: { ...glass, padding: '25px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 8px 25px rgba(0,0,0,0.25)' },
  formTitle: { color: '#fff', marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', boxSizing: 'border-box', height: '70px', outline: 'none' },
  formRow: { display: 'flex', gap: '10px' },
  select: { flex: 1, padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#25234f', color: '#fff', fontSize: '14px', outline: 'none' },
  formButtons: { display: 'flex', gap: '10px' },
  submitBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.12)', color: '#e8e8f0', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  aiHint: { color: '#a0a3c4', fontSize: '13px', marginTop: '12px' },
  aiError: { color: '#fca5a5', fontSize: '13px', marginTop: '12px' },
  suggestionRow: { display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 15px', marginBottom: '10px', cursor: 'pointer' },
  kanban: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  column: { ...glass, flex: 1, borderRadius: '16px', padding: '20px', boxShadow: '0 8px 25px rgba(0,0,0,0.25)', minHeight: '400px' },
  columnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  columnTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 },
  columnCount: { backgroundColor: 'rgba(99,102,241,0.3)', color: '#c4c8ff', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: 'bold' },
  taskCard: { backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '15px', marginBottom: '10px', borderLeft: '4px solid #6366f1' },
  taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  taskTitle: { fontSize: '14px', fontWeight: '600', color: '#fff', margin: 0 },
  priorityBadge: { padding: '2px 8px', borderRadius: '10px', color: '#fff', fontSize: '11px' },
  taskDesc: { color: '#a0a3c4', fontSize: '12px', marginBottom: '6px' },
  taskDeadline: { color: '#8b8fb5', fontSize: '11px', marginBottom: '10px' },
  taskActions: { display: 'flex', gap: '6px' },
  moveBtn: { flex: 1, backgroundColor: 'rgba(99,102,241,0.25)', color: '#c4c8ff', border: '1px solid rgba(99,102,241,0.4)', padding: '5px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  deleteTaskBtn: { backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer' },
  emptyCol: { color: '#6f739a', textAlign: 'center', padding: '30px', fontSize: '13px' }
};

export default Tasks;
