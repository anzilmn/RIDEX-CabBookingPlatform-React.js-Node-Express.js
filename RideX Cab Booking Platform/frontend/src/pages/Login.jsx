import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Zap, Mail, Lock, Eye, EyeOff, Info } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [blockedInfo, setBlockedInfo] = useState(null); // { blockReason, unblockTime }

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email or username required';
    if (!form.password) e.password = 'Password required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'driver') navigate('/driver');
      else navigate('/rider');
    } catch (err) {
      const data = err.response?.data;
      if (data?.isBlocked) {
        // Show dedicated blocked screen instead of generic error
        setBlockedInfo({ blockReason: data.blockReason, unblockTime: data.unblockTime });
        return;
      }
      const msg = data?.message || 'Login failed';
      toast.error(msg);
      setErrors({ general: msg });
    } finally { setLoading(false); }
  };

  // ── Blocked screen ──────────────────────────────────────────
  if (blockedInfo) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', background:'var(--black)' }}>
      <div style={{ width:'100%', maxWidth:'440px', textAlign:'center' }}>
        <div style={{ fontSize:'72px', marginBottom:'20px' }}>🚫</div>
        <h1 style={{ fontFamily:'Syne', fontSize:'28px', fontWeight:800, color:'#e74c3c', marginBottom:'12px' }}>
          Account Blocked
        </h1>
        <div style={{ background:'rgba(231,76,60,0.08)', border:'1px solid rgba(231,76,60,0.25)', borderRadius:'14px', padding:'24px', marginBottom:'24px' }}>
          <div style={{ marginBottom:'14px' }}>
            <div style={{ fontSize:'12px', color:'var(--gray-400)', marginBottom:'5px' }}>Reason</div>
            <div style={{ fontWeight:600, fontSize:'15px', color:'var(--white)' }}>{blockedInfo.blockReason}</div>
          </div>
          {blockedInfo.unblockTime ? (
            <div>
              <div style={{ fontSize:'12px', color:'var(--gray-400)', marginBottom:'5px' }}>Auto-unblocks at</div>
              <div style={{ fontWeight:600, fontSize:'14px', color:'#e8ff47' }}>{blockedInfo.unblockTime}</div>
              <div style={{ fontSize:'12px', color:'var(--gray-400)', marginTop:'6px' }}>Your account will automatically unlock after 23 hours.</div>
            </div>
          ) : (
            <div style={{ fontSize:'13px', color:'var(--gray-400)' }}>This block is permanent. Contact support to appeal.</div>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ fontSize:'13px', color:'var(--gray-400)' }}>All platform features are locked during this period.</div>
          <button
            onClick={() => setBlockedInfo(null)}
            style={{ marginTop:'12px', background:'transparent', border:'1px solid #333', borderRadius:'10px', color:'var(--gray-400)', padding:'11px', cursor:'pointer', fontSize:'14px' }}
          >
            ← Try a different account
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:'80px 24px 24px', background:'var(--black)'
    }}>
      <div style={{ width:'100%', maxWidth:'440px' }}>
        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{
            width:56, height:56, background:'var(--accent)', borderRadius:'14px',
            display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:'16px'
          }}>
            <Zap size={28} color="#0a0a0a" fill="#0a0a0a"/>
          </div>
          <h1 style={{ fontSize:'32px', fontWeight:800 }}>Welcome back</h1>
          <p style={{ color:'var(--gray-400)', marginTop:'8px' }}>Sign in to your RideX account</p>
        </div>

        {/* Demo credentials */}
        <div style={{
          background:'rgba(232,255,71,0.06)', border:'1px solid rgba(232,255,71,0.2)',
          borderRadius:'10px', padding:'14px 16px', marginBottom:'24px',
          display:'flex', gap:'10px', alignItems:'flex-start'
        }}>
          <Info size={16} style={{ flexShrink:0, marginTop:'2px', color:'var(--accent)' }}/>
          <div style={{ fontSize:'12px', color:'var(--gray-400)', lineHeight:1.7 }}>
            <strong style={{color:'var(--accent)'}}>Demo Credentials</strong><br/>
            Admin: <code style={{color:'var(--white)'}}>admin / admin</code><br/>
            Rider: <code style={{color:'var(--white)'}}>arjun@example.com / rider123</code><br/>
            Driver: <code style={{color:'var(--white)'}}>anzil@example.com / driver123</code>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          {errors.general && (
            <div style={{ padding:'12px 16px', background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.3)', borderRadius:'8px', color:'var(--danger)', fontSize:'14px' }}>
              {errors.general}
            </div>
          )}
          <Input
            label="Email / Username"
            icon={<Mail size={16}/>}
            type="text"
            value={form.email}
            onChange={e=>setForm({...form,email:e.target.value})}
            placeholder="email@example.com or admin"
            error={errors.email}
          />
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ fontSize:'13px', color:'var(--gray-400)', fontWeight:500 }}>Password</label>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--gray-400)', display:'flex' }}>
                <Lock size={16}/>
              </div>
              <input
                type={showPwd?'text':'password'}
                value={form.password}
                onChange={e=>setForm({...form,password:e.target.value})}
                placeholder="••••••••"
                style={{ paddingLeft:'42px', paddingRight:'42px' }}
              />
              <button type="button" onClick={()=>setShowPwd(!showPwd)} style={{
                position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', color:'var(--gray-400)', display:'flex', cursor:'pointer'
              }}>
                {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {errors.password && <span style={{ fontSize:'12px', color:'var(--danger)' }}>{errors.password}</span>}
          </div>

          <Button type="submit" size="lg" loading={loading} style={{ width:'100%', marginTop:'8px' }}>
            Sign In
          </Button>
        </form>

        <p style={{ textAlign:'center', marginTop:'24px', color:'var(--gray-400)', fontSize:'14px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--accent)', fontWeight:600 }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
