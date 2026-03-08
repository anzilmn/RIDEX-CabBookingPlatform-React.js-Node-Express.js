import React from 'react';

export default function Button({ children, variant='primary', size='md', loading, disabled, style, ...props }) {
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'8px',
    borderRadius:'10px', fontFamily:'DM Sans, sans-serif', fontWeight:600,
    cursor: disabled||loading ? 'not-allowed' : 'pointer',
    transition:'all 0.2s', border:'none', outline:'none',
    opacity: disabled||loading ? 0.6 : 1,
  };
  const sizes = {
    sm: { padding:'8px 16px', fontSize:'13px' },
    md: { padding:'12px 24px', fontSize:'15px' },
    lg: { padding:'16px 32px', fontSize:'16px' },
  };
  const variants = {
    primary: { background:'var(--accent)', color:'#0a0a0a' },
    secondary: { background:'#1a1a1a', color:'var(--white)', border:'1px solid var(--border)' },
    danger: { background:'#2d0000', color:'var(--danger)', border:'1px solid var(--danger)' },
    ghost: { background:'transparent', color:'var(--white)', border:'1px solid var(--border)' },
    success: { background:'#002d14', color:'var(--success)', border:'1px solid var(--success)' },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant], ...style }} disabled={disabled||loading} {...props}>
      {loading ? <span style={{
        width:16, height:16, border:'2px solid currentColor', borderTopColor:'transparent',
        borderRadius:'50%', animation:'spin 0.6s linear infinite', display:'inline-block'
      }}/> : children}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}
