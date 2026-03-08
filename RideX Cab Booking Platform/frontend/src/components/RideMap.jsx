import React, { useEffect, useRef, useState } from 'react';

export default function RideMap({ pickup, drop, driverLocation, style }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);   // leaflet map instance
  const markersRef   = useRef({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  // ── load Leaflet once ────────────────────────────────────
  useEffect(() => {
    // CSS
    if (!document.getElementById('leaflet-css')) {
      const link   = document.createElement('link');
      link.id      = 'leaflet-css';
      link.rel     = 'stylesheet';
      link.href    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (window.L) { setReady(true); return; }

    const script    = document.createElement('script');
    script.src      = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload   = () => setReady(true);
    script.onerror  = () => setError(true);
    document.head.appendChild(script);
  }, []);

  // ── init map once Leaflet is ready ───────────────────────
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    try {
      const L   = window.L;
      const lat = pickup?.lat ?? 9.9312;
      const lng = pickup?.lng ?? 76.2673;
      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false })
                   .setView([lat, lng], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    } catch (e) {
      setError(true);
    }
  }, [ready]);

  // ── update markers whenever props change ─────────────────
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    try {
      const L   = window.L;
      const map = mapRef.current;

      // Remove old overlays
      Object.values(markersRef.current).forEach(m => { try { m.remove(); } catch {} });
      markersRef.current = {};

      const bounds = [];

      const addMarker = (coord, html, popupText) => {
        if (!coord?.lat || !coord?.lng) return;
        const icon   = L.divIcon({ html, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
        const marker = L.marker([coord.lat, coord.lng], { icon })
                        .addTo(map)
                        .bindPopup(`<div style="color:#111;font-weight:600;font-size:12px">${popupText}</div>`);
        bounds.push([coord.lat, coord.lng]);
        return marker;
      };

      markersRef.current.pickup = addMarker(
        pickup,
        `<div style="background:#e8ff47;border:3px solid #0a0a0a;border-radius:50%;width:18px;height:18px;box-shadow:0 0 0 4px rgba(232,255,71,0.3)"></div>`,
        `📍 ${pickup?.address || 'Pickup'}`,
      );
      markersRef.current.drop = addMarker(
        drop,
        `<div style="background:#e74c3c;border:3px solid #fff;border-radius:50%;width:18px;height:18px;box-shadow:0 0 0 4px rgba(231,76,60,0.3)"></div>`,
        `🏁 ${drop?.address || 'Drop'}`,
      );
      markersRef.current.driver = addMarker(
        driverLocation,
        `<div style="background:#3498db;border:2px solid #fff;border-radius:8px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:13px">🚗</div>`,
        `🚗 ${driverLocation?.driverName || 'Driver'}`,
      );

      // Route line
      if (pickup?.lat && drop?.lat) {
        if (markersRef.current.line) { try { markersRef.current.line.remove(); } catch {} }
        markersRef.current.line = L.polyline(
          [[pickup.lat, pickup.lng], [drop.lat, drop.lng]],
          { color:'#e8ff47', weight:3, opacity:0.7, dashArray:'8,6' },
        ).addTo(map);
      }

      // Fit view
      const validBounds = bounds.filter(Boolean);
      if (validBounds.length > 1) {
        map.fitBounds(validBounds, { padding: [36, 36] });
      } else if (validBounds.length === 1) {
        map.setView(validBounds[0], 14);
      }

      // Force re-render (fixes blank map on first show)
      setTimeout(() => { try { map.invalidateSize(); } catch {} }, 100);
    } catch {}
  }, [ready, pickup, drop, driverLocation]);

  if (error) {
    return (
      <div style={{
        background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center',
        color:'var(--gray-400)', fontSize:'13px', borderRadius:'10px', ...style,
      }}>
        🗺 Map unavailable (check internet connection)
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{
        background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center',
        color:'var(--gray-400)', fontSize:'13px', borderRadius:'10px', ...style,
      }}>
        <span style={{ animation:'spin 1s linear infinite', display:'inline-block', marginRight:'8px' }}>⟳</span>
        Loading map...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ borderRadius:'12px', overflow:'hidden', border:'1px solid #2a2a2a', ...style }}>
      <div ref={containerRef} style={{ width:'100%', height:'100%', minHeight: style?.height || '300px' }} />
    </div>
  );
}
