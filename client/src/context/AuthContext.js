import React, { createContext, useState, useEffect, useRef } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Global timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTaskId, setTimerTaskId] = useState('');
  const [timerProjectId, setTimerProjectId] = useState('');
  const [timerNote, setTimerNote] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setTimerRunning(false);
    setTimerSeconds(0);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, logout,
      timerRunning, setTimerRunning,
      timerSeconds, setTimerSeconds,
      timerTaskId, setTimerTaskId,
      timerProjectId, setTimerProjectId,
      timerNote, setTimerNote,
      formatTime
    }}>
      {children}
    </AuthContext.Provider>
  );
};