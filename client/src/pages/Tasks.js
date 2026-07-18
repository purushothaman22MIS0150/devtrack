import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const Tasks = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      const res = await api.get('/projects');
      const found = res.data.find(p => p.id === parseInt(projectId));
      setProject(found);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

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

  const columns = ['To Do', 'In Progress', 'Done'];

  const priorityColor = (p) => p === 'High' ? '#ef4444' : p === 'Medium' ? '#f59e0b' : '#10b981';

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>⚡ DevTrack</h2>
        <nav>
          <p style={styles.navItem} onClick={() => navigate('/dashboard')}>🏠 Dashboard</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>📁 Projects</p>
          <p style={{ ...styles.navItem, ...styles.activeNav }}>✅ Tasks</p>
          <p style={styles.navItem} onClick={() => navigate('/timelogs')}>⏱ Time Logs</p>
        </nav>
        <button style={styles.logoutBtn} onClick={() => { localStorage.clear(); navigate('/login'); }}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>✅ Tasks</h1>
            {project && <p style={styles.projectName}>📁 {project.title}</p>}
          </div>
          <div style={styles.topButtons}>
            <button style={styles.backBtn} onClick={() => navigate('/projects')}>← Back</button>
            <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>+ New Task</button>
          </div>
        </div>

        {/* Create Form */}
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

        {/* Kanban Board */}
        <div style={styles.kanban}>
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

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif' },
  sidebar: { width: '240px', backgroundColor: '#1e1b4b', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  logo: { color: '#fff', fontSize: '22px', marginBottom: '40px' },
  navItem: { color: '#a5b4fc', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', marginBottom: '5px', fontSize: '15px' },
  activeNav: { backgroundColor: '#4f46e5', color: '#fff' },
  logoutBtn: { backgroundColor: '#f5576c', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  main: { flex: 1, padding: '40px', overflowX: 'auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  pageTitle: { fontSize: '26px', fontWeight: 'bold', color: '#1e1b4b', margin: 0 },
  projectName: { color: '#666', fontSize: '14px', marginTop: '4px' },
  topButtons: { display: 'flex', gap: '10px' },
  backBtn: { backgroundColor: '#e5e7eb', color: '#333', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' },
  addBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  formCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  formTitle: { color: '#1e1b4b', marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', height: '70px' },
  formRow: { display: 'flex', gap: '10px' },
  select: { flex: 1, padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' },
  formButtons: { display: 'flex', gap: '10px' },
  submitBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#e5e7eb', color: '#333', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
  kanban: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  column: { flex: 1, backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', minHeight: '400px' },
  columnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  columnTitle: { fontSize: '16px', fontWeight: 'bold', color: '#1e1b4b', margin: 0 },
  columnCount: { backgroundColor: '#ede9fe', color: '#4f46e5', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: 'bold' },
  taskCard: { backgroundColor: '#f8f9ff', borderRadius: '8px', padding: '15px', marginBottom: '10px', borderLeft: '4px solid #4f46e5' },
  taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  taskTitle: { fontSize: '14px', fontWeight: 'bold', color: '#1e1b4b', margin: 0 },
  priorityBadge: { padding: '2px 8px', borderRadius: '10px', color: '#fff', fontSize: '11px' },
  taskDesc: { color: '#666', fontSize: '12px', marginBottom: '6px' },
  taskDeadline: { color: '#888', fontSize: '11px', marginBottom: '10px' },
  taskActions: { display: 'flex', gap: '6px' },
  moveBtn: { flex: 1, backgroundColor: '#ede9fe', color: '#4f46e5', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
  deleteTaskBtn: { backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 8px', borderRadius: '5px', cursor: 'pointer' },
  emptyCol: { color: '#ccc', textAlign: 'center', padding: '30px', fontSize: '13px' }
};

export default Tasks;