import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Zap, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name:'', email:'', phone:'', password:'', confirmPassword:'',
    role: params.get('role') || 'rider'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email || !/^[\w.-]+@[\w.-]+\.\w+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone || !/^[0-9]{10,15}$/.test(form.phone)) e.phone = 'Valid phone number required (10-15 digits)';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      const user = await register(data);
      toast.success('Account created! Welcome to RideX.');
      if (user.role === 'driver') navigate('/driver');
      else navigate('/rider');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      const errs = err.response?.data?.errors || [];
      const fieldErrs = {};
      errs.forEach(e => { fieldErrs[e.field] = e.msg; });
      setErrors({ ...fieldErrs, general: Object.keys(fieldErrs).length ? '' : msg });
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px 24px' }}>
      <div style={{ width:'100%', maxWidth:'480px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:56, height:56, background:'var(--accent)', borderRadius:'14px', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
            <Zap size={28} color="#0a0a0a" fill="#0a0a0a"/>
          </div>
          <h1 style={{ fontSize:'32px', fontWeight:800 }}>Create Account</h1>
          <p style={{ color:'var(--gray-400)', marginTop:'8px' }}>Join RideX today</p>
        </div>

        {/* Role selector */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'24px' }}>
          {['rider','driver'].map(r => (
            <button key={r} type="button" onClick={()=>setForm({...form,role:r})} style={{
              padding:'12px', borderRadius:'10px', border:'1px solid',
              borderColor: form.role===r ? 'var(--accent)' : 'var(--border)',
              background: form.role===r ? 'rgba(232,255,71,0.1)' : '#1a1a1a',
              color: form.role===r ? 'var(--accent)' : 'var(--gray-400)',
              fontWeight:600, fontSize:'15px', textTransform:'capitalize', cursor:'pointer'
            }}>
              {r==='rider'?'🏃 Rider':'🚗 Driver'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {errors.general && (
            <div style={{ padding:'12px 16px', background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.3)', borderRadius:'8px', color:'var(--danger)', fontSize:'14px' }}>
              {errors.general}
            </div>
          )}
          <Input label="Full Name" icon={<User size={16}/>} type="text" value={form.name} onChange={set('name')} placeholder="John Doe" error={errors.name}/>
          <Input label="Email" icon={<Mail size={16}/>} type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" error={errors.email}/>
          <Input label="Phone Number" icon={<Phone size={16}/>} type="tel" value={form.phone} onChange={set('phone')} placeholder="9876543210" error={errors.phone}/>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ fontSize:'13px', color:'var(--gray-400)', fontWeight:500 }}>Password</label>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--gray-400)', display:'flex' }}><Lock size={16}/></div>
              <input type={showPwd?'text':'password'} value={form.password} onChange={set('password')} placeholder="Min 6 characters" style={{ paddingLeft:'42px', paddingRight:'42px' }}/>
              <button type="button" onClick={()=>setShowPwd(!showPwd)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--gray-400)', display:'flex', cursor:'pointer' }}>
                {showPwd?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
            {errors.password && <span style={{ fontSize:'12px', color:'var(--danger)' }}>{errors.password}</span>}
          </div>
          <Input label="Confirm Password" icon={<Lock size={16}/>} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" error={errors.confirmPassword}/>
          <Button type="submit" size="lg" loading={loading} style={{ width:'100%', marginTop:'8px' }}>
            Create {form.role==='driver'?'Driver':'Rider'} Account
          </Button>
        </form>

        <p style={{ textAlign:'center', marginTop:'20px', color:'var(--gray-400)', fontSize:'14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--accent)', fontWeight:600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
