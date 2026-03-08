import React from 'react';

const colors = {
  requested: { bg:'#1a1400', color:'#f0c040', border:'#f0c040' },
  accepted: { bg:'#00141a', color:'var(--info)', border:'var(--info)' },
  driver_arriving: { bg:'#001440', color:'#60a0ff', border:'#60a0ff' },
  in_progress: { bg:'#001a0a', color:'var(--success)', border:'var(--success)' },
  completed: { bg:'#001a0a', color:'var(--success)', border:'var(--success)' },
  cancelled: { bg:'#1a0000', color:'var(--danger)', border:'var(--danger)' },
  pending: { bg:'#1a1400', color:'var(--warning)', border:'var(--warning)' },
  paid: { bg:'#001a0a', color:'var(--success)', border:'var(--success)' },
  approved: { bg:'#001a0a', color:'var(--success)', border:'var(--success)' },
  online: { bg:'#001a0a', color:'var(--success)', border:'var(--success)' },
  offline: { bg:'#1a1a1a', color:'var(--gray-400)', border:'var(--gray-400)' },
  open: { bg:'#1a0010', color:'#ff6090', border:'#ff6090' },
  resolved: { bg:'#001a0a', color:'var(--success)', border:'var(--success)' },
};

export default function Badge({ status, label }) {
  const c = colors[status] || { bg:'#1a1a1a', color:'var(--gray-400)', border:'#444' };
  return (
    <span style={{
      display:'inline-block', padding:'3px 10px', borderRadius:'20px', fontSize:'12px',
      fontWeight:600, border:`1px solid ${c.border}`, background:c.bg, color:c.color,
      letterSpacing:'0.3px', textTransform:'capitalize'
    }}>
      {label || status?.replace(/_/g,' ')}
    </span>
  );
}
