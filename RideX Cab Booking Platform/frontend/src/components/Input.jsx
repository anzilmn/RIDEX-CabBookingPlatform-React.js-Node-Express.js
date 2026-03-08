import React from 'react';

export default function Input({ label, error, icon, style, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px', ...style }}>
      {label && <label style={{ fontSize:'13px', color:'var(--gray-400)', fontWeight:500 }}>{label}</label>}
      <div style={{ position:'relative' }}>
        {icon && (
          <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
            color:'var(--gray-400)', display:'flex', alignItems:'center', pointerEvents:'none' }}>
            {icon}
          </div>
        )}
        <input style={{ paddingLeft: icon ? '42px' : '16px' }} {...props} />
      </div>
      {error && <span style={{ fontSize:'12px', color:'var(--danger)' }}>{error}</span>}
    </div>
  );
}
