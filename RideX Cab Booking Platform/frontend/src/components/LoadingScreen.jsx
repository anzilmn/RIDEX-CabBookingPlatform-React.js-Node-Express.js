import React from 'react';
import { Zap } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div style={{
      position:'fixed', inset:0, background:'var(--black)',
      display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:'20px', zIndex:9999
    }}>
      <div style={{
        width:60, height:60, background:'var(--accent)', borderRadius:'16px',
        display:'flex', alignItems:'center', justifyContent:'center',
        animation:'pulse 1s ease-in-out infinite'
      }}>
        <Zap size={30} color="#0a0a0a" fill="#0a0a0a" />
      </div>
      <div style={{ fontFamily:'Syne', fontSize:'24px', fontWeight:800 }}>
        RIDE<span style={{ color:'var(--accent)' }}>X</span>
      </div>
      <div style={{
        width:40, height:3, background:'#222', borderRadius:'2px', overflow:'hidden'
      }}>
        <div style={{
          height:'100%', background:'var(--accent)', borderRadius:'2px',
          animation:'loading 1s ease-in-out infinite'
        }}/>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes loading { 0%{width:0;marginLeft:0} 50%{width:100%;marginLeft:0} 100%{width:0;marginLeft:100%} }
      `}</style>
    </div>
  );
}
