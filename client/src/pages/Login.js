import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
            setError(err.response?.data?.message || 'Cannot reach server');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>DevTrack</h2>
        <p style={styles.subtitle}>Login to your account</p>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit">Login</button>
        </form>
        <p style={styles.link}>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', fontFamily: 'Poppins, sans-serif' },
  box: { backgroundColor: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '40px', borderRadius: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', width: '100%', maxWidth: '380px' },
  title: { textAlign: 'center', color: '#fff', marginBottom: '5px', fontWeight: '600' },
  subtitle: { textAlign: 'center', color: '#a0a3c4', marginBottom: '25px' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  button: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' },
  error: { color: '#fca5a5', marginBottom: '10px', textAlign: 'center' },
  link: { textAlign: 'center', marginTop: '15px', fontSize: '14px', color: '#a0a3c4' }
};

export default Login;