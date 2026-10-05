import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { user, token, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameMsg, setNameMsg] = useState({ type: '', text: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const handleNameSave = async (e) => {
    e.preventDefault();
    setNameMsg({ type: '', text: '' });
    setSavingName(true);
    try {
      const res = await api.put('/auth/profile', { name });
      login(res.data.user, token);
      setNameMsg({ type: 'success', text: 'Name updated successfully' });
    } catch (err) {
      setNameMsg({ type: 'error', text: err.response?.data?.message || 'Something went wrong' });
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      return setPassMsg({ type: 'error', text: 'New passwords do not match' });
    }

    setSavingPass(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassMsg({ type: 'success', text: 'Password updated successfully' });
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Something went wrong' });
    } finally {
      setSavingPass(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const msgStyle = (m) => ({
    ...styles.msg,
    color: m.type === 'success' ? '#6ee7b7' : '#fca5a5',
  });

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>⚡ DevTrack</h2>
        <nav>
          <p style={styles.navItem} onClick={() => navigate('/dashboard')}>🏠 Dashboard</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>📁 Projects</p>
          <p style={styles.navItem} onClick={() => navigate('/projects')}>✅ Tasks</p>
          <p style={styles.navItem} onClick={() => navigate('/timelogs')}>⏱ Time Logs</p>
          <p style={styles.navItem} onClick={() => navigate('/analytics')}>📊 Analytics</p>
          <p style={{ ...styles.navItem, ...styles.activeNav }}>👤 Profile</p>
        </nav>
        <button style={styles.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
      </div>

      <div style={styles.main}>
        <h1 style={styles.pageTitle}>👤 Profile</h1>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Account Details</h3>
          <form onSubmit={handleNameSave}>
            <label style={styles.label}>Name</label>
            <input style={styles.input} type="text" value={name} onChange={e => setName(e.target.value)} required />
            <label style={styles.label}>Email</label>
            <input style={{ ...styles.input, opacity: 0.6, cursor: 'not-allowed' }} type="email" value={user?.email || ''} disabled />
            {nameMsg.text && <p style={msgStyle(nameMsg)}>{nameMsg.text}</p>}
            <button style={styles.saveBtn} type="submit" disabled={savingName}>
              {savingName ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Change Password</h3>
          <form onSubmit={handlePasswordSave}>
            <label style={styles.label}>Current Password</label>
            <input style={styles.input} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            <label style={styles.label}>New Password</label>
            <input style={styles.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
            <label style={styles.label}>Confirm New Password</label>
            <input style={styles.input} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} required />
            {passMsg.text && <p style={msgStyle(passMsg)}>{passMsg.text}</p>}
            <button style={styles.saveBtn} type="submit" disabled={savingPass}>
              {savingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
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
  pageTitle: { fontSize: '26px', fontWeight: '600', color: '#fff', marginBottom: '30px' },
  card: { ...glass, borderRadius: '16px', padding: '25px', marginBottom: '25px', maxWidth: '520px', boxShadow: '0 8px 25px rgba(0,0,0,0.25)' },
  cardTitle: { color: '#fff', marginBottom: '18px', fontSize: '18px', fontWeight: '600' },
  label: { display: 'block', color: '#a0a3c4', fontSize: '13px', marginBottom: '6px' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  saveBtn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '10px', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 15px rgba(99,102,241,0.4)' },
  msg: { fontSize: '13px', marginBottom: '12px' }
};

export default Profile;