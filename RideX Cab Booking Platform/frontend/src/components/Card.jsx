import React from 'react';

export default function Card({ children, style, hover, ...props }) {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <div
      style={{
        background:'var(--card-bg)', border:'1px solid var(--border)',
        borderRadius:'var(--radius)', padding:'24px',
        transition:'all 0.2s',
        ...(hover && isHovered ? { borderColor:'var(--accent)', transform:'translateY(-2px)' } : {}),
        ...style
      }}
      onMouseEnter={()=>setIsHovered(true)}
      onMouseLeave={()=>setIsHovered(false)}
      {...props}
    >
      {children}
    </div>
  );
}
