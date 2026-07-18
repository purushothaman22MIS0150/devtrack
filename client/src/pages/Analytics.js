import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../utils/api';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, logsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/timelogs')
      ]);
      setProjects(projectsRes.data);
      setLogs(logsRes.data);

      // Fetch all tasks for all projects
      const allTasks = [];
      for (const project of projectsRes.data) {
        const tasksRes = await api.get(`/projects/${project.id}/tasks`);
        allTasks.push(...tasksRes.data);
      }
      setTasks(allTasks);
    } catch (err) {
      console.error(err);
    }
  };

  // Hours per day chart data
  const hoursPerDay = logs.reduce((acc, log) => {
    const date = new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) existing.hours += parseFloat(log.hours);
    else acc.push({ date, hours: parseFloat(log.hours) });
    return acc;
  }, []);

  // Task status pie chart data
  const taskStatusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'To Do').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Done', value: tasks.filter(t => t.status === 'Done').length },
  ].filter(d => d.value > 0);

  // Project status pie chart data
  const projectStatusData = [
    { name: 'Active', value: projects.filter(p => p.status === 'Active').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length },
    { name: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length },
  ].filter(d => d.value > 0);

  const totalHours = logs.reduce((sum, log) => sum + parseFloat(log.hours), 0).toFixed(1);

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
          <p style={{ ...styles.navItem, ...styles.activeNav }}>📊 Analytics</p>
        </nav>
        <button style={styles.logoutBtn} onClick={() => { localStorage.clear(); navigate('/login'); }}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <h1 style={styles.pageTitle}>📊 Analytics</h1>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            <h3 style={styles.statNum}>{projects.length}</h3>
            <p style={styles.statLabel}>Total Projects</p>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
            <h3 style={styles.statNum}>{tasks.length}</h3>
            <p style={styles.statLabel}>Total Tasks</p>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
            <h3 style={styles.statNum}>{tasks.filter(t => t.status === 'Done').length}</h3>
            <p style={styles.statLabel}>Tasks Completed</p>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
            <h3 style={styles.statNum}>{totalHours}h</h3>
            <p style={styles.statLabel}>Total Hours</p>
          </div>
        </div>

        {/* Charts Row */}
        <div style={styles.chartsRow}>
          {/* Hours Per Day Bar Chart */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Hours Logged Per Day</h3>
            {hoursPerDay.length === 0 ? (
              <p style={styles.empty}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hoursPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Task Status Pie Chart */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Task Status Distribution</h3>
            {taskStatusData.length === 0 ? (
              <p style={styles.empty}>No tasks yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={taskStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {taskStatusData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Project Status Chart */}
        <div style={styles.chartCardFull}>
          <h3 style={styles.chartTitle}>Project Status Overview</h3>
          {projectStatusData.length === 0 ? (
            <p style={styles.empty}>No projects yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {projectStatusData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
  pageTitle: { fontSize: '26px', fontWeight: 'bold', color: '#1e1b4b', marginBottom: '30px' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
  statCard: { flex: 1, padding: '20px', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  statNum: { fontSize: '32px', margin: 0 },
  statLabel: { fontSize: '13px', marginTop: '5px', opacity: 0.9 },
  chartsRow: { display: 'flex', gap: '20px', marginBottom: '20px' },
  chartCard: { flex: 1, backgroundColor: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' },
  chartCardFull: { backgroundColor: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' },
  chartTitle: { color: '#1e1b4b', marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' },
  empty: { color: '#999', textAlign: 'center', padding: '40px' }
};

export default Analytics;