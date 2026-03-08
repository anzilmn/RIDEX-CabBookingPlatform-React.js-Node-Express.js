import React from 'react';
import Card from './Card';

export default function StatCard({ icon, label, value, sub, color = 'var(--accent)' }) {
  return (
    <Card style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ color:'var(--gray-400)', fontSize:'13px', fontWeight:500 }}>{label}</span>
        <div style={{
          width:40, height:40, borderRadius:'10px',
          background: color === 'var(--accent)' ? 'rgba(232,255,71,0.1)' : 'rgba(46,204,113,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center', color
        }}>{icon}</div>
      </div>
      <div>
        <div style={{ fontSize:'28px', fontWeight:700, fontFamily:'Syne', color:'var(--white)' }}>{value}</div>
        {sub && <div style={{ fontSize:'12px', color:'var(--gray-400)', marginTop:'4px' }}>{sub}</div>}
      </div>
    </Card>
  );
}
