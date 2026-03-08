import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import Button from './Button';

const CATEGORIES = [
  { id:'rude_behavior',     label:'😤 Rude Behavior'        },
  { id:'overcharging',      label:'💸 Overcharging'          },
  { id:'wrong_route',       label:'🗺 Wrong Route'           },
  { id:'vehicle_condition', label:'🚗 Poor Vehicle'          },
  { id:'safety',            label:'🛡 Safety Concern'        },
  { id:'other',             label:'📋 Other'                 },
];

export default function ComplaintModal({ ride, onClose, onSubmitted }) {
  const [category,    setCategory]    = useState('other');
  const [subject,     setSubject]     = useState('');
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);

  const submit = async () => {
    if (!subject.trim())     { toast.error('Please enter a subject'); return; }
    if (!description.trim()) { toast.error('Please describe the issue'); return; }
    setLoading(true);
    try {
      await api.post('/complaints', {
        rideId:      ride?._id,
        subject:     subject.trim(),
        description: description.trim(),
        category,
      });
      setDone(true);
      toast.success('Complaint submitted successfully!');
      setTimeout(() => { onSubmitted?.(); onClose?.(); }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'20px'
    }}>
      <div style={{
        background:'#111', border:'1px solid #2a2a2a', borderRadius:'20px',
        width:'100%', maxWidth:'460px', overflow:'hidden',
        animation:'popIn 0.25s ease-out',
      }}>
        {done ? (
          /* ── Success state ── */
          <div style={{ padding:'52px 32px', textAlign:'center' }}>
            <div style={{ fontSize:'60px', marginBottom:'16px' }}>📋</div>
            <h2 style={{ fontFamily:'Syne', fontSize:'22px', fontWeight:800, marginBottom:'10px' }}>Complaint Received!</h2>
            <p style={{ color:'var(--gray-400)', fontSize:'14px', lineHeight:1.6 }}>
              Admin will review your complaint and take action within 24 hours.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding:'18px 20px', borderBottom:'1px solid #1a1a1a',
              background:'linear-gradient(135deg,rgba(231,76,60,0.06),#0d0d0d)',
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:36, height:36, borderRadius:'10px', background:'rgba(231,76,60,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <AlertTriangle size={17} color="#e74c3c"/>
                </div>
                <div>
                  <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'16px', margin:0 }}>Report an Issue</h2>
                  <p style={{ color:'var(--gray-400)', fontSize:'12px', margin:0, marginTop:'1px' }}>We take all complaints seriously</p>
                </div>
              </div>
              <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', padding:'4px' }}>
                <X size={18}/>
              </button>
            </div>

            <div style={{ padding:'18px 20px' }}>
              {/* Ride info */}
              {ride && (
                <div style={{ background:'#1a1a1a', borderRadius:'8px', padding:'9px 12px', marginBottom:'14px', fontSize:'12px', color:'var(--gray-400)', border:'1px solid #2a2a2a' }}>
                  🚗 {ride.pickupLocation?.address} → {ride.dropLocation?.address} · ₹{ride.fare}
                </div>
              )}

              {/* Category chips */}
              <div style={{ marginBottom:'14px' }}>
                <label style={{ fontSize:'12px', color:'var(--gray-400)', display:'block', marginBottom:'8px' }}>Category *</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setCategory(c.id)} style={{
                      padding:'8px 10px', borderRadius:'8px', border:'1px solid', textAlign:'left',
                      borderColor: category===c.id ? '#e74c3c' : '#2a2a2a',
                      background:  category===c.id ? 'rgba(231,76,60,0.1)' : 'transparent',
                      color:       category===c.id ? '#e74c3c' : 'var(--gray-400)',
                      fontSize:'12px', fontWeight:500, cursor:'pointer', transition:'all 0.15s',
                    }}>{c.label}</button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom:'12px' }}>
                <label style={{ fontSize:'12px', color:'var(--gray-400)', display:'block', marginBottom:'5px' }}>Subject *</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Brief title of your complaint..."
                  maxLength={100}
                  style={{ width:'100%', boxSizing:'border-box' }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ fontSize:'12px', color:'var(--gray-400)', display:'block', marginBottom:'5px' }}>Description *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what happened in detail..."
                  maxLength={1000} rows={4}
                  style={{
                    width:'100%', boxSizing:'border-box',
                    background:'#1a1a1a', border:'1px solid #2a2a2a',
                    borderRadius:'10px', color:'var(--white)', padding:'10px 14px',
                    fontSize:'13px', resize:'none', outline:'none', fontFamily:'DM Sans, sans-serif',
                    transition:'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor='#e74c3c'}
                  onBlur={e  => e.target.style.borderColor='#2a2a2a'}
                />
                <div style={{ fontSize:'11px', color:'#555', textAlign:'right', marginTop:'2px' }}>{description.length}/1000</div>
              </div>

              <div style={{ display:'flex', gap:'10px' }}>
                <Button variant="secondary" onClick={onClose} style={{ flex:1 }}>Cancel</Button>
                <Button
                  onClick={submit} loading={loading}
                  style={{ flex:2, background:'#e74c3c', borderColor:'#e74c3c', color:'#fff' }}
                >
                  <Send size={13}/> Submit Complaint
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
