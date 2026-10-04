import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import Spinner from '../components/Spinner';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
      const total = res.data.length;
      const active = res.data.filter(p => p.status === 'Active').length;
      const completed = res.data.filter(p => p.status === 'Completed').length;
      setStats({ total, active, completed });
       } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>⚡ DevTrack</h2>
        <nav>
          <p style={{ ...styles.navItem, ...styles.activeNav }}>🏠 Dashboard</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>📁 Projects</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>✅ Tasks</p>
          <p style={styles.navItem} onClick={() => navigate('/timelogs')}>⏱ Time Logs</p>
          <p style={styles.navItem} onClick={() => navigate('/analytics')}>📊 Analytics</p>
        </nav>
        <button style={styles.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.welcome}>Welcome back, {user?.name} 👋</h1>
          <p style={styles.date}>{new Date().toDateString()}</p>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsRow}>
          <div style={{ ...styles.card, background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            <h3 style={styles.cardNum}>{stats.total}</h3>
            <p style={styles.cardLabel}>Total Projects</p>
          </div>
          <div style={{ ...styles.card, background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
            <h3 style={styles.cardNum}>{stats.active}</h3>
            <p style={styles.cardLabel}>Active Projects</p>
          </div>
          <div style={{ ...styles.card, background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
            <h3 style={styles.cardNum}>{stats.completed}</h3>
            <p style={styles.cardLabel}>Completed</p>
          </div>
        </div>

        {/* Recent Projects */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Projects</h2>
                    {loading ? (
            <Spinner text="Loading projects..." />
          ) : projects.length === 0 ? (
            <p style={styles.empty}>No projects yet. <span style={styles.link} onClick={() => navigate('/projects')}>Create one!</span></p>
          ) : (
            projects.slice(0, 5).map(project => (
              <div key={project.id} style={styles.projectCard}>
                <div>
                  <h3 style={styles.projectTitle}>{project.title}</h3>
                  <p style={styles.projectDesc}>{project.description}</p>
                </div>
                <span style={{ ...styles.badge, backgroundColor: project.status === 'Active' ? '#10b981' : project.status === 'Completed' ? '#3b82f6' : '#f59e0b' }}>
                  {project.status}
                </span>
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
  header: { marginBottom: '30px' },
  welcome: { fontSize: '28px', fontWeight: '600', color: '#fff' },
  date: { color: '#a0a3c4', marginTop: '5px' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '40px' },
  card: { flex: 1, padding: '25px', borderRadius: '16px', color: '#fff', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' },
  cardNum: { fontSize: '36px', margin: 0, fontWeight: '600' },
  cardLabel: { fontSize: '14px', marginTop: '5px', opacity: 0.9 },
  section: { ...glass, borderRadius: '16px', padding: '25px', boxShadow: '0 8px 25px rgba(0,0,0,0.25)' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '20px' },
  empty: { color: '#a0a3c4', textAlign: 'center', padding: '20px' },
  link: { color: '#a5b4fc', cursor: 'pointer', fontWeight: 'bold' },
  projectCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '10px' },
  projectTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 },
  projectDesc: { fontSize: '13px', color: '#a0a3c4', marginTop: '4px' },
  badge: { padding: '4px 12px', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
};

export default Dashboard;