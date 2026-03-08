import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Shield, Clock, Star, ChevronRight, Car, Users, TrendingUp, Quote } from 'lucide-react';
import api from '../api/axios';

const features = [
  { icon:<Zap size={22}/>, title:'Instant Matching', desc:'Get matched with nearby drivers in under 60 seconds.' },
  { icon:<Shield size={22}/>, title:'Safe & Secure', desc:'All drivers verified. Every ride tracked in real-time.' },
  { icon:<Clock size={22}/>, title:'24/7 Available', desc:'Book a ride anytime, anywhere, any day of the week.' },
  { icon:<Star size={22}/>, title:'Top Rated Drivers', desc:'Community-rated drivers with verified profiles.' },
];

const STARS = (n) => Array.from({length:5},(_,i)=>(
  <Star key={i} size={14} fill={i<n?'#f39c12':'none'} color={i<n?'#f39c12':'#444'} style={{display:'inline'}}/>
));

export default function Home() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get('/reviews/public').then(({ data }) => setReviews(data.reviews || [])).catch(()=>{});
  }, []);

  return (
    <div style={{ paddingTop:'64px', minHeight:'100vh' }}>
      {/* Hero */}
      <section style={{ padding:'80px 24px 60px', maxWidth:'1100px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'center' }}>
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 16px', background:'rgba(232,255,71,0.1)', borderRadius:'20px', border:'1px solid rgba(232,255,71,0.3)', marginBottom:'24px', fontSize:'13px', color:'var(--accent)' }}>
            <Zap size={14} fill="var(--accent)"/> Premium Ride Experience
          </div>
          <h1 style={{ fontSize:'clamp(36px,5vw,68px)', fontWeight:800, lineHeight:1.05, marginBottom:'18px' }}>
            Your City.<br/><span style={{ color:'var(--accent)' }}>Your Ride.</span><br/>Your Way.
          </h1>
          <p style={{ color:'var(--gray-400)', fontSize:'16px', lineHeight:1.7, marginBottom:'32px', maxWidth:'460px' }}>
            RideX connects you with premium drivers instantly. Safe, reliable, real-time tracked.
          </p>
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
            {user ? (
              <Link to={user.role==='admin'?'/admin':user.role==='driver'?'/driver':'/rider'} style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'14px 28px', background:'var(--accent)', borderRadius:'12px', color:'#0a0a0a', fontWeight:700, fontSize:'16px' }}>
                Go to Dashboard <ChevronRight size={18}/>
              </Link>
            ) : (
              <>
                <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'14px 28px', background:'var(--accent)', borderRadius:'12px', color:'#0a0a0a', fontWeight:700, fontSize:'16px' }}>
                  Book a Ride <ChevronRight size={18}/>
                </Link>
                <Link to="/register?role=driver" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'14px 28px', background:'#1a1a1a', borderRadius:'12px', color:'var(--white)', fontWeight:600, fontSize:'16px', border:'1px solid var(--border)' }}>
                  Become a Driver
                </Link>
              </>
            )}
          </div>
        </div>
        <div style={{ position:'relative' }}>
          <div style={{ background:'linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%)', borderRadius:'24px', padding:'36px', border:'1px solid var(--border)', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, right:0, width:'180px', height:'180px', background:'radial-gradient(circle,rgba(232,255,71,0.12) 0%,transparent 70%)', borderRadius:'50%', transform:'translate(30%,-30%)' }}/>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              {[{label:'Pickup',addr:'MG Road, Kochi',color:'var(--accent)'},{label:'Drop',addr:'Airport, Kochi',color:'var(--info)'}].map(loc=>(
                <div key={loc.label} style={{ background:'#0f0f0f', borderRadius:'12px', padding:'14px', border:'1px solid #2a2a2a', display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:10,height:10,borderRadius:'50%',background:loc.color,flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:'11px', color:'var(--gray-400)', marginBottom:'2px' }}>{loc.label}</div>
                    <div style={{ fontWeight:600, fontSize:'14px' }}>{loc.addr}</div>
                  </div>
                </div>
              ))}
              <div style={{ background:'linear-gradient(90deg,var(--accent),var(--accent-dim))', borderRadius:'12px', padding:'12px 18px', textAlign:'center', color:'#0a0a0a', fontWeight:700 }}>
                Estimated: ₹180 · 12 min
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding:'36px 24px', background:'#0d0d0d', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:'700px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'32px', textAlign:'center' }}>
          {[{icon:<Car size={20}/>,val:'10,000+',label:'Rides Completed'},{icon:<Users size={20}/>,val:'5,000+',label:'Happy Riders'},{icon:<TrendingUp size={20}/>,val:'500+',label:'Active Drivers'}].map(s=>(
            <div key={s.label}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'6px', color:'var(--accent)' }}>{s.icon}</div>
              <div style={{ fontSize:'28px', fontWeight:800, fontFamily:'Syne' }}>{s.val}</div>
              <div style={{ fontSize:'13px', color:'var(--gray-400)', marginTop:'3px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding:'70px 24px', maxWidth:'1100px', margin:'0 auto' }}>
        <h2 style={{ fontSize:'36px', fontWeight:800, textAlign:'center', marginBottom:'10px' }}>Why <span style={{color:'var(--accent)'}}>RideX</span>?</h2>
        <p style={{ color:'var(--gray-400)', textAlign:'center', marginBottom:'44px', fontSize:'15px' }}>Everything you need for a seamless ride experience</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:'18px' }}>
          {features.map(f=>(
            <div key={f.title} style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'16px', padding:'26px', transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.transform='translateY(-3px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateY(0)'}}>
              <div style={{ width:46,height:46,borderRadius:'12px',background:'rgba(232,255,71,0.1)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)',marginBottom:'14px' }}>{f.icon}</div>
              <h3 style={{ fontSize:'17px', fontWeight:700, marginBottom:'7px' }}>{f.title}</h3>
              <p style={{ color:'var(--gray-400)', fontSize:'13px', lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section style={{ padding:'70px 24px', background:'#080808', borderTop:'1px solid var(--border)' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <h2 style={{ fontSize:'36px', fontWeight:800, textAlign:'center', marginBottom:'10px' }}>What Riders Say</h2>
          <p style={{ color:'var(--gray-400)', textAlign:'center', marginBottom:'44px', fontSize:'15px' }}>Real reviews from real rides</p>
          {reviews.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--gray-400)', padding:'40px', fontSize:'14px' }}>
              No reviews yet. Be the first to ride and review! ⭐
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'18px' }}>
              {reviews.map(r => (
                <div key={r._id} style={{
                  background:'#111', border:'1px solid #1e1e1e', borderRadius:'16px', padding:'22px',
                  transition:'all 0.2s', position:'relative'
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(232,255,71,0.3)';e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e1e1e';e.currentTarget.style.transform='translateY(0)'}}>
                  <Quote size={18} color="rgba(232,255,71,0.2)" style={{ position:'absolute', top:18, right:18 }}/>
                  <div style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'14px' }}>
                    <div style={{ width:40,height:40,borderRadius:'50%',background:'rgba(232,255,71,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'var(--accent)',fontFamily:'Syne',fontSize:'16px',flexShrink:0 }}>
                      {r.riderId?.name?.[0]||'?'}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'14px' }}>{r.riderId?.name||'Anonymous'}</div>
                      <div style={{ display:'flex', gap:'2px', marginTop:'2px' }}>{STARS(r.rating)}</div>
                    </div>
                  </div>
                  {r.review && (
                    <p style={{ color:'var(--gray-400)', fontSize:'13px', lineHeight:1.6, marginBottom:'12px', fontStyle:'italic' }}>
                      "{r.review}"
                    </p>
                  )}
                  {r.tags?.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
                      {r.tags.map(t=>(
                        <span key={t} style={{ padding:'3px 8px', borderRadius:'10px', background:'rgba(232,255,71,0.08)', color:'var(--accent)', fontSize:'11px', border:'1px solid rgba(232,255,71,0.2)' }}>
                          {t.replace(/_/g,' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.driverId?.userId?.name && (
                    <div style={{ fontSize:'11px', color:'#555' }}>Driver: {r.driverId.userId.name}</div>
                  )}
                  <div style={{ fontSize:'11px', color:'#444', marginTop:'4px' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {!user && (
        <section style={{ padding:'60px 24px', textAlign:'center', borderTop:'1px solid var(--border)' }}>
          <h2 style={{ fontSize:'34px', fontWeight:800, marginBottom:'10px' }}>Ready to <span style={{color:'var(--accent)'}}>Ride</span>?</h2>
          <p style={{ color:'var(--gray-400)', marginBottom:'24px' }}>Join thousands of happy riders today.</p>
          <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'16px 36px', background:'var(--accent)', borderRadius:'12px', color:'#0a0a0a', fontWeight:700, fontSize:'17px' }}>
            Create Free Account <ChevronRight size={20}/>
          </Link>
        </section>
      )}

      <footer style={{ padding:'22px', borderTop:'1px solid var(--border)', textAlign:'center', color:'var(--gray-400)', fontSize:'13px' }}>
        © 2024 RideX. Built with ❤ by Anzil.
      </footer>
    </div>
  );
}
