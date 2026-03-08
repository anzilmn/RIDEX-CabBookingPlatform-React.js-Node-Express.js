import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Zap } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };
  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'driver') return '/driver';
    return '/rider';
  };

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:1000,
      background:'rgba(10,10,10,0.95)', backdropFilter:'blur(20px)',
      borderBottom:'1px solid #1a1a1a', padding:'0 24px', height:'64px',
      display:'flex', alignItems:'center', justifyContent:'space-between'
    }}>
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:36, height:36, background:'var(--accent)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Zap size={20} color="#0a0a0a" fill="#0a0a0a"/>
        </div>
        <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:'20px', letterSpacing:'-0.5px' }}>
          RIDE<span style={{ color:'var(--accent)' }}>X</span>
        </span>
      </Link>

      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        {user ? (
          <>
            <Link to={getDashboardLink()} style={{
              display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px',
              background:'#1a1a1a', borderRadius:'8px', fontSize:'14px', border:'1px solid var(--border)'
            }}>
              <LayoutDashboard size={16}/> Dashboard
            </Link>
            <NotificationPanel />
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', background:'#1a1a1a', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'14px' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ color:'#0a0a0a', fontWeight:700, fontSize:'12px' }}>{user.name?.[0]?.toUpperCase()}</span>
              </div>
              <span style={{ color:'var(--gray-400)' }}>{user.name?.split(' ')[0]}</span>
            </div>
            <button onClick={handleLogout} style={{
              padding:'8px 14px', background:'transparent', border:'1px solid #333', borderRadius:'8px',
              color:'var(--gray-400)', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px', cursor:'pointer'
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--danger)';e.currentTarget.style.color='var(--danger)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#333';e.currentTarget.style.color='var(--gray-400)'}}>
              <LogOut size={15}/> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ padding:'8px 20px', background:'transparent', border:'1px solid #333', borderRadius:'8px', fontSize:'14px', color:'var(--gray-400)' }}>Login</Link>
            <Link to="/register" style={{ padding:'8px 20px', background:'var(--accent)', borderRadius:'8px', fontSize:'14px', color:'#0a0a0a', fontWeight:600 }}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
