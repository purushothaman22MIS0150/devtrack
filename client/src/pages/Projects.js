import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', { title, description, deadline });
      setTitle('');
      setDescription('');
      setDeadline('');
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>⚡ DevTrack</h2>
        <nav>
          <p style={styles.navItem} onClick={() => navigate('/dashboard')}>🏠 Dashboard</p>
          <p style={{ ...styles.navItem, ...styles.activeNav }}>📁 Projects</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>✅ Tasks</p>
          <p style={styles.navItem} onClick={() => navigate('/timelogs')}>⏱ Time Logs</p>
        </nav>
        <button style={styles.logoutBtn} onClick={() => { localStorage.clear(); navigate('/login'); }}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.topBar}>
          <h1 style={styles.pageTitle}>📁 Projects</h1>
          <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>+ New Project</button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Create New Project</h3>
            <form onSubmit={handleCreate}>
              <input style={styles.input} type="text" placeholder="Project Title" value={title} onChange={e => setTitle(e.target.value)} required />
              <textarea style={styles.textarea} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              <input style={styles.input} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              <div style={styles.formButtons}>
                <button style={styles.submitBtn} type="submit">Create</button>
                <button style={styles.cancelBtn} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Projects Grid */}
        <div style={styles.grid}>
          {projects.length === 0 ? (
            <p style={styles.empty}>No projects yet. Create your first one!</p>
          ) : (
            projects.map(project => (
              <div key={project.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{project.title}</h3>
                  <span style={{ ...styles.badge, backgroundColor: project.status === 'Active' ? '#10b981' : project.status === 'Completed' ? '#3b82f6' : '#f59e0b' }}>
                    {project.status}
                  </span>
                </div>
                <p style={styles.cardDesc}>{project.description}</p>
                <p style={styles.cardDeadline}>📅 {project.deadline ? new Date(project.deadline).toDateString() : 'No deadline'}</p>
                <div style={styles.cardFooter}>
                  <button style={styles.viewBtn} onClick={() => navigate(`/projects/${project.id}/tasks`)}>View Tasks</button>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(project.id)}>Delete</button>
                </div>
              </div>
            ))
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
  addBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, boxShadow: '0 4px 15px rgba(99,102,241,0.4)' },
  formCard: { ...glass, padding: '25px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 8px 25px rgba(0,0,0,0.25)' },
  formTitle: { color: '#fff', marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', boxSizing: 'border-box', height: '80px', outline: 'none' },
  formButtons: { display: 'flex', gap: '10px' },
  submitBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.12)', color: '#e8e8f0', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { ...glass, borderRadius: '16px', padding: '20px', boxShadow: '0 8px 25px rgba(0,0,0,0.25)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 },
  badge: { padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '12px' },
  cardDesc: { color: '#a0a3c4', fontSize: '13px', marginBottom: '10px' },
  cardDeadline: { color: '#8b8fb5', fontSize: '12px', marginBottom: '15px' },
  cardFooter: { display: 'flex', gap: '10px' },
  viewBtn: { flex: 1, backgroundColor: 'rgba(99,102,241,0.25)', color: '#c4c8ff', border: '1px solid rgba(99,102,241,0.4)', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  deleteBtn: { flex: 1, backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  empty: { color: '#a0a3c4', textAlign: 'center', padding: '40px' }
};

export default Projects;
