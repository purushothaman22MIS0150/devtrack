import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import TimeLogs from './pages/TimeLogs';
import Analytics from './pages/Analytics';
import AISummary from './pages/AISummary';

const App = () => {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/projects" element={user ? <Projects /> : <Navigate to="/login" />} />
        <Route path="/projects/:projectId/tasks" element={user ? <Tasks /> : <Navigate to="/login" />} />
        <Route path="/timelogs" element={user ? <TimeLogs /> : <Navigate to="/login" />} />
        <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/login" />} />
        <Route path="/ai-summary" element={user ? <AISummary /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;