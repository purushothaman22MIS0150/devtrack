import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const NotificationBell = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await api.get('/notifications');
      setItems(res.data);
    } catch (err) {
      console.error('Notifications failed');
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = (deadline) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(deadline);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    if (diff < 0) return { text: `Overdue by ${-diff} day(s)`, color: '#fca5a5' };
    if (diff === 0) return { text: 'Due today', color: '#fcd34d' };
    return { text: `Due in ${diff} day(s)`, color: '#a5b4fc' };
  };

  return (
    <div ref={ref} style={styles.wrap}>
      <button style={styles.bell} onClick={() => setOpen(!open)}>
        🔔
        {items.length > 0 && <span style={styles.badge}>{items.length}</span>}
      </button>
      {open && (
        <div style={styles.dropdown}>
          <p style={styles.heading}>Deadlines</p>
          {items.length === 0 && <p style={styles.empty}>No upcoming deadlines</p>}
          {items.map((t) => {
            const l = label(t.deadline);
            return (
              <div
                key={t.id}
                style={styles.item}
                onClick={() => { setOpen(false); navigate(`/projects/${t.project_id}/tasks`); }}
              >
                <p style={styles.itemTitle}>{t.title}</p>
                <p style={styles.itemSub}>{t.project_title}</p>
                <p style={{ ...styles.itemSub, color: l.color }}>{l.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  wrap: { position: 'relative', display: 'inline-block' },
  bell: { position: 'relative', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', fontSize: '16px', cursor: 'pointer', color: '#fff' },
  badge: { position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropdown: { position: 'absolute', right: 0, top: '48px', width: '280px', maxHeight: '340px', overflowY: 'auto', background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', padding: '10px', zIndex: 1000, textAlign: 'left' },
  heading: { color: '#fff', fontWeight: 600, margin: '4px 6px 8px', fontSize: '14px' },
  empty: { color: '#a0a3c4', fontSize: '13px', margin: '6px' },
  item: { padding: '10px', borderRadius: '8px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  itemTitle: { color: '#fff', fontSize: '14px', margin: 0 },
  itemSub: { color: '#a0a3c4', fontSize: '12px', margin: '2px 0 0' }
};

export default NotificationBell;