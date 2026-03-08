import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Trash2, Car, MapPin, Star, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

const TYPE_ICONS = {
  ride_requested: '🚖', ride_accepted: '✅', driver_arriving: '📍',
  ride_started: '🚗', ride_completed: '🏁', ride_cancelled: '❌',
  payment_received: '💰', review_received: '⭐', driver_approved: '🎉',
  driver_rejected: '⚠', account_blocked: '🚫', new_ride_available: '🔔',
  rider_cancelled: '❌', ride_started_driver: '🚗', ride_completed_driver: '✅'
};

export default function NotificationPanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const { socket } = useSocket();

  useEffect(() => { fetchNotifications(); }, []);

  // Real-time new notifications
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 50));
      setUnread(u => u + 1);
      // Browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notif.title, { body: notif.message, icon: '/favicon.ico' });
      }
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {} finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const wasUnread = notifications.find(n => n._id === id && !n.isRead);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (wasUnread) setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        style={{
          position: 'relative', background: '#1a1a1a', border: '1px solid #2a2a2a',
          borderRadius: '10px', padding: '8px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
          color: open ? 'var(--accent)' : 'var(--gray-400)',
          transition: 'all 0.2s'
        }}
      >
        <Bell size={18} style={{ animation: unread > 0 ? 'bellRing 1s ease-in-out infinite' : 'none' }} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            background: 'var(--danger)', color: '#fff',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: '11px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--black)'
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position: 'absolute', top: '48px', right: 0, width: '380px', maxHeight: '520px',
          background: '#111', border: '1px solid #2a2a2a', borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 2000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #1a1a1a',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#0d0d0d'
          }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '16px', fontFamily: 'Syne' }}>Notifications</h3>
              {unread > 0 && <span style={{ fontSize: '12px', color: 'var(--accent)' }}>{unread} unread</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{
                  background: 'transparent', border: '1px solid #333', borderRadius: '6px',
                  padding: '5px 10px', color: 'var(--gray-400)', fontSize: '12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: '4px'
              }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--gray-400)' }}>
                <Bell size={36} style={{ opacity: 0.3, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600 }}>All caught up!</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => {
                    if (!n.isRead) markRead(n._id);
                    // ✅ ride_completed taps go straight to ride history
                    if (n.type === 'ride_completed') {
                      setOpen(false);
                      navigate('/rider?tab=history');
                    }
                  }}
                  style={{
                    padding: '14px 20px', borderBottom: '1px solid #1a1a1a', cursor: 'pointer',
                    background: n.isRead ? 'transparent' : 'rgba(232,255,71,0.03)',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    transition: 'background 0.15s',
                    borderLeft: n.isRead ? '3px solid transparent' : '3px solid var(--accent)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                  onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(232,255,71,0.03)'}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                    background: '#1a1a1a', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px'
                  }}>
                    {TYPE_ICONS[n.type] || '🔔'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: '14px', marginBottom: '3px' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-400)', lineHeight: 1.5, wordBreak: 'break-word' }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '5px' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  <button onClick={(e) => deleteNotif(n._id, e)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#444', padding: '2px', flexShrink: 0,
                    opacity: 0.5, transition: 'opacity 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(12deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(8deg); }
          60% { transform: rotate(-6deg); }
          75% { transform: rotate(4deg); }
        }
      `}</style>
    </div>
  );
}
