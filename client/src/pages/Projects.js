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
  addBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  formCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  formTitle: { color: '#1e1b4b', marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', height: '80px' },
  formButtons: { display: 'flex', gap: '10px' },
  submitBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#e5e7eb', color: '#333', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardTitle: { fontSize: '16px', fontWeight: 'bold', color: '#1e1b4b', margin: 0 },
  badge: { padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '12px' },
  cardDesc: { color: '#666', fontSize: '13px', marginBottom: '10px' },
  cardDeadline: { color: '#888', fontSize: '12px', marginBottom: '15px' },
  cardFooter: { display: 'flex', gap: '10px' },
  viewBtn: { flex: 1, backgroundColor: '#ede9fe', color: '#4f46e5', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  deleteBtn: { flex: 1, backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  empty: { color: '#666', textAlign: 'center', padding: '40px' }
};

export default Projects;
