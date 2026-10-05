import React, { useEffect, useRef, useState } from 'react';
import api from '../utils/api';

const WORK_MINUTES = 25;
const WORK = WORK_MINUTES * 60;
const BREAK = 5 * 60;

const load = (key) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) return saved;
  } catch (e) {}
  return { mode: 'work', running: false, endsAt: null, remaining: WORK };
};

const PomodoroTimer = ({ taskId }) => {
  const key = `pomodoro_${taskId}`;
  const [state, setState] = useState(() => load(key));
  const [now, setNow] = useState(Date.now());
  const finishing = useRef(false);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [state.running]);

  const secondsLeft = state.running
    ? Math.max(0, Math.ceil((state.endsAt - now) / 1000))
    : state.remaining;

  useEffect(() => {
    if (!state.running || secondsLeft > 0) return;
    if (finishing.current) return;
    finishing.current = true;

    const finishedMode = state.mode;
    const nextMode = finishedMode === 'work' ? 'break' : 'work';
    setState({
      mode: nextMode,
      running: false,
      endsAt: null,
      remaining: nextMode === 'work' ? WORK : BREAK
    });

    if (finishedMode === 'work') {
      (async () => {
        try {
          await api.post('/timelogs', {
            task_id: taskId,
            hours: (WORK_MINUTES / 60).toFixed(2),
            log_date: new Date().toLocaleDateString('en-CA'),
            note: `Pomodoro focus session (${WORK_MINUTES} min)`
          });
          alert('🍅 Focus session done! 0.42 hours added to your Time Logs.');
        } catch (err) {
          console.error(err);
        }
      })();
    }
  }, [secondsLeft, state, taskId]);

  const toggle = () => {
    if (state.running) {
      setState({ ...state, running: false, endsAt: null, remaining: secondsLeft });
    } else {
      finishing.current = false;
      const t = Date.now();
      setNow(t);
      setState({ ...state, running: true, endsAt: t + state.remaining * 1000 });
    }
  };

  const reset = () => {
    finishing.current = false;
    setState({ mode: 'work', running: false, endsAt: null, remaining: WORK });
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div style={styles.box}>
      <span style={styles.label}>{state.mode === 'work' ? '🍅 Focus' : '☕ Break'}</span>
      <span style={styles.time}>{mins}:{secs}</span>
      <button style={styles.btn} onClick={toggle}>
        {state.running ? 'Pause' : 'Start'}
      </button>
      <button style={styles.btn} onClick={reset}>↺</button>
    </div>
  );
};

const styles = {
  box: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '6px 10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)' },
  label: { color: '#c4c8ff', fontSize: '12px' },
  time: { color: '#fff', fontSize: '14px', fontWeight: '600', flex: 1 },
  btn: { backgroundColor: 'rgba(99,102,241,0.25)', color: '#c4c8ff', border: '1px solid rgba(99,102,241,0.4)', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }
};

export default PomodoroTimer;