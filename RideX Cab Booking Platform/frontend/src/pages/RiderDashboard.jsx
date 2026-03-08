import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Car, Navigation, History, DollarSign, Star, XCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import ReviewModal from '../components/ReviewModal';
import ComplaintModal from '../components/ComplaintModal';
import RideMap from '../components/RideMap';

const VEHICLE_TYPES = [
  { id:'sedan',      label:'Sedan',    icon:'🚗', desc:'Comfortable 4-seater' },
  { id:'suv',        label:'SUV',      icon:'🚙', desc:'Spacious 6-seater'    },
  { id:'hatchback',  label:'Hatchback',icon:'🚘', desc:'Economy choice'       },
  { id:'motorcycle', label:'Bike',     icon:'🏍️', desc:'Fast, single rider'   },
  { id:'auto',       label:'Auto',     icon:'🛺', desc:'Budget friendly'      },
];

const LOCATIONS = [
  { label:'MG Road, Kochi',      lat:9.9312,  lng:76.2673 },
  { label:'Edapally, Kochi',     lat:10.0159, lng:76.3076 },
  { label:'Kakkanad, Kochi',     lat:9.9944,  lng:76.3510 },
  { label:'Marine Drive, Kochi', lat:9.9618,  lng:76.2810 },
  { label:'Airport, Kochi',      lat:10.1553, lng:76.3921 },
  { label:'Lulu Mall, Kochi',    lat:9.9944,  lng:76.3010 },
  { label:'Aluva, Kochi',        lat:10.1004, lng:76.3571 },
  { label:'Fort Kochi',          lat:9.9658,  lng:76.2432 },
];

export default function RiderDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Use -1 as "nothing selected" so index 0 is valid
  const [pickupIdx, setPickupIdx] = useState(-1);
  const [dropIdx,   setDropIdx]   = useState(-1);
  const [vehicleType, setVehicleType] = useState('sedan');
  const [payMethod,   setPayMethod]   = useState('cash');
  const [estimates,   setEstimates]   = useState(null);
  const [activeRide,  setActiveRide]  = useState(null);
  const [driverLoc,   setDriverLoc]   = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [stats,       setStats]       = useState({ total:0, completed:0, spent:0 });
  const [tab,         setTab]         = useState(searchParams.get('tab') || 'book');
  const [reviewRide,    setReviewRide]    = useState(null);
  const [complaintRide, setComplaintRide] = useState(null);
  const [loading,     setLoading]     = useState({});

  const pickup = pickupIdx >= 0 ? LOCATIONS[pickupIdx] : null;
  const drop   = dropIdx   >= 0 ? LOCATIONS[dropIdx]   : null;

  const setLoad = (k, v) => setLoading(l => ({ ...l, [k]: v }));

  // ── data fetchers ──────────────────────────────────────────
  const fetchActiveRide = useCallback(async () => {
    try {
      const { data } = await api.get('/rides/active');
      setActiveRide(data.ride || null);
      return data.ride || null;
    } catch { return null; }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/rides/my-rides');
      const rides = data.rides || [];
      setRideHistory(rides);
      const done = rides.filter(r => r.status === 'completed');
      setStats({ total: rides.length, completed: done.length, spent: done.reduce((a,r) => a + r.fare, 0) });
    } catch {}
  }, []);

  useEffect(() => {
    fetchActiveRide();
    fetchHistory();
  }, []);

  // ── socket (safe – only if context available) ─────────────
  useEffect(() => {
    let socket = null;
    try {
      // Dynamically import so crash here doesn't kill the page
      import('../context/SocketContext').then(({ useSocket: _unused }) => {}).catch(() => {});
    } catch {}
    return () => {};
  }, []);

  // ── actions ────────────────────────────────────────────────
  const getEstimate = async () => {
    if (!pickup || !drop) { toast.error('Select pickup and drop first'); return; }
    if (pickupIdx === dropIdx) { toast.error('Pickup and drop cannot be same'); return; }
    setLoad('est', true);
    try {
      const { data } = await api.post('/rides/estimate', {
        pickupLocation: { address: pickup.label, lat: pickup.lat, lng: pickup.lng },
        dropLocation:   { address: drop.label,   lat: drop.lat,   lng: drop.lng   },
      });
      setEstimates(data.estimates);
      toast.success('Fare estimated!');
    } catch { toast.error('Failed to get estimate'); }
    finally { setLoad('est', false); }
  };

  const bookRide = async () => {
    if (!pickup) { toast.error('Select pickup location'); return; }
    if (!drop)   { toast.error('Select drop location');   return; }
    if (pickupIdx === dropIdx) { toast.error('Pickup and drop cannot be the same'); return; }
    if (activeRide) { toast.error('You already have an active ride'); return; }
    setLoad('book', true);
    try {
      const { data } = await api.post('/rides/request', {
        pickupLocation: { address: pickup.label, lat: pickup.lat, lng: pickup.lng },
        dropLocation:   { address: drop.label,   lat: drop.lat,   lng: drop.lng   },
        vehicleType,
        paymentMethod: payMethod,
      });
      setActiveRide(data.ride);
      toast.success('🚖 Ride requested! Looking for drivers...');
      setTab('active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally { setLoad('book', false); }
  };

  const cancelRide = async () => {
    if (!activeRide) return;
    setLoad('cancel', true);
    try {
      await api.put(`/rides/${activeRide._id}/cancel`, { reason: 'Cancelled by rider' });
      setActiveRide(null);
      toast.success('Ride cancelled');
      fetchHistory();
      setTab('book');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    } finally { setLoad('cancel', false); }
  };

  // ── tab definitions ────────────────────────────────────────
  const TABS = [
    { id:'book',    label:'Book Ride', icon:<Car       size={15}/> },
    { id:'active',  label:'Active',    icon:<Navigation size={15}/> },
    { id:'history', label:'History',   icon:<History   size={15}/> },
  ];

  // ── render ─────────────────────────────────────────────────
  return (
    <div style={{ paddingTop:'80px', minHeight:'100vh', padding:'80px 24px 40px', maxWidth:'1100px', margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'26px', fontWeight:800 }}>
          Hey, <span style={{ color:'var(--accent)' }}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color:'var(--gray-400)', marginTop:'4px', fontSize:'14px' }}>Where are you headed today?</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'24px' }}>
        <StatCard icon={<Car  size={18}/>} label="Total Rides"  value={stats.total}/>
        <StatCard icon={<Star size={18}/>} label="Completed"    value={stats.completed} color="var(--success)"/>
        <StatCard icon={<DollarSign size={18}/>} label="Total Spent" value={`₹${stats.spent}`} color="var(--info)"/>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'20px', background:'#111', padding:'5px', borderRadius:'12px', border:'1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, padding:'9px', borderRadius:'8px', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
            fontSize:'13px', fontWeight:600, transition:'all 0.2s',
            background: tab === t.id ? 'var(--accent)' : 'transparent',
            color:       tab === t.id ? '#0a0a0a'       : 'var(--gray-400)',
          }}>
            {t.icon}{t.label}
            {t.id === 'active' && activeRide && (
              <span style={{ width:7, height:7, borderRadius:'50%', background: tab==='active' ? '#0a0a0a' : 'var(--accent)', display:'inline-block' }}/>
            )}
          </button>
        ))}
      </div>

      {/* ── BOOK TAB ─────────────────────────────────────── */}
      {tab === 'book' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px' }}>

          {/* Left: booking form */}
          <Card>
            <h3 style={{ marginBottom:'18px', fontWeight:700 }}>Book a Ride</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

              {/* Pickup */}
              <div>
                <label style={{ fontSize:'12px', color:'var(--gray-400)', display:'block', marginBottom:'5px' }}>
                  📍 Pickup Location *
                </label>
                <select
                  value={pickupIdx}
                  onChange={e => setPickupIdx(Number(e.target.value))}
                >
                  <option value={-1}>Select pickup location...</option>
                  {LOCATIONS.map((loc, i) => (
                    <option key={i} value={i}>{loc.label}</option>
                  ))}
                </select>
              </div>

              {/* Drop */}
              <div>
                <label style={{ fontSize:'12px', color:'var(--gray-400)', display:'block', marginBottom:'5px' }}>
                  🏁 Drop Location *
                </label>
                <select
                  value={dropIdx}
                  onChange={e => setDropIdx(Number(e.target.value))}
                >
                  <option value={-1}>Select destination...</option>
                  {LOCATIONS.map((loc, i) => (
                    <option key={i} value={i}>{loc.label}</option>
                  ))}
                </select>
              </div>

              {/* Map preview — only render when BOTH are selected */}
              {pickup && drop && (
                <div style={{ borderRadius:'10px', overflow:'hidden', border:'1px solid var(--border)' }}>
                  <RideMap
                    pickup={{ ...pickup, address: pickup.label }}
                    drop={  { ...drop,   address: drop.label   }}
                    style={{ height:'180px', borderRadius:0, border:'none' }}
                  />
                </div>
              )}

              {/* Payment */}
              <div>
                <label style={{ fontSize:'12px', color:'var(--gray-400)', display:'block', marginBottom:'5px' }}>
                  💳 Payment Method
                </label>
                <div style={{ display:'flex', gap:'6px' }}>
                  {['cash','card','wallet'].map(m => (
                    <button key={m} onClick={() => setPayMethod(m)} style={{
                      flex:1, padding:'9px', borderRadius:'8px', border:'1px solid',
                      borderColor: payMethod === m ? 'var(--accent)' : 'var(--border)',
                      background:  payMethod === m ? 'rgba(232,255,71,0.1)' : '#1a1a1a',
                      color:       payMethod === m ? 'var(--accent)' : 'var(--gray-400)',
                      fontSize:'12px', fontWeight:600, cursor:'pointer', textTransform:'capitalize',
                    }}>{m}</button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                <Button variant="secondary" onClick={getEstimate} loading={loading.est}  style={{ flex:1 }} size="sm">
                  Get Estimate
                </Button>
                <Button onClick={bookRide} loading={loading.book} style={{ flex:1 }} size="sm">
                  Book Now 🚖
                </Button>
              </div>
            </div>
          </Card>

          {/* Right: vehicle selector */}
          <Card>
            <h3 style={{ marginBottom:'16px', fontWeight:700 }}>Choose Vehicle</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {VEHICLE_TYPES.map(v => (
                <button key={v.id} onClick={() => setVehicleType(v.id)} style={{
                  display:'flex', alignItems:'center', gap:'12px', padding:'12px',
                  background: vehicleType === v.id ? 'rgba(232,255,71,0.08)' : '#1a1a1a',
                  border: `1px solid ${vehicleType === v.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius:'10px', cursor:'pointer', textAlign:'left', width:'100%', transition:'all 0.15s',
                }}>
                  <span style={{ fontSize:'22px' }}>{v.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, color:'var(--white)', fontSize:'14px' }}>{v.label}</div>
                    <div style={{ fontSize:'11px', color:'var(--gray-400)' }}>{v.desc}</div>
                  </div>
                  {estimates && estimates[v.id] && (
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, color:'var(--accent)', fontSize:'14px' }}>₹{estimates[v.id].fare}</div>
                      <div style={{ fontSize:'11px', color:'var(--gray-400)' }}>{estimates[v.id].distance}km</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── ACTIVE TAB ───────────────────────────────────── */}
      {tab === 'active' && (
        <div style={{ display:'grid', gridTemplateColumns: activeRide ? '1fr 1fr' : '1fr', gap:'18px' }}>

          <Card>
            {activeRide ? (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                  <h3 style={{ fontWeight:700 }}>Active Ride</h3>
                  <Badge status={activeRide.status}/>
                </div>

                {/* Status steps */}
                {['requested','accepted','driver_arriving','in_progress','completed'].map((s, i, arr) => {
                  const curIdx = arr.indexOf(activeRide.status);
                  const done   = i <= curIdx;
                  const active = s === activeRide.status;
                  const labels = { requested:'Ride Requested', accepted:'Driver Found', driver_arriving:'Driver Arriving', in_progress:'Ride In Progress', completed:'Completed' };
                  return (
                    <div key={s} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'5px 0' }}>
                      <div style={{
                        width:20, height:20, borderRadius:'50%',
                        border: `2px solid ${done ? 'var(--accent)' : '#333'}`,
                        background: done ? 'var(--accent)' : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      }}>
                        {done && <span style={{ fontSize:'9px', color:'#0a0a0a', fontWeight:900 }}>✓</span>}
                      </div>
                      <span style={{ fontSize:'13px', fontWeight: active ? 700 : 400, color: done ? 'var(--white)' : '#555' }}>
                        {labels[s]}
                        {active && <span style={{ color:'var(--accent)', marginLeft:'6px', fontSize:'11px' }}>● Now</span>}
                      </span>
                    </div>
                  );
                })}

                {/* Pickup / drop */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', margin:'16px 0' }}>
                  {[
                    { label:'📍 Pickup', val: activeRide.pickupLocation?.address },
                    { label:'🏁 Drop',   val: activeRide.dropLocation?.address   },
                  ].map(r => (
                    <div key={r.label} style={{ background:'#1a1a1a', borderRadius:'10px', padding:'12px' }}>
                      <div style={{ fontSize:'11px', color:'var(--gray-400)', marginBottom:'4px' }}>{r.label}</div>
                      <div style={{ fontWeight:600, fontSize:'13px' }}>{r.val}</div>
                    </div>
                  ))}
                </div>

                {/* Fare / Distance */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' }}>
                  {[
                    { l:'Fare',     v:`₹${activeRide.fare}` },
                    { l:'Distance', v:`${activeRide.distance}km` },
                  ].map(c => (
                    <div key={c.l} style={{ background:'#1a1a1a', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:'11px', color:'var(--gray-400)', marginBottom:'3px' }}>{c.l}</div>
                      <div style={{ fontWeight:700, color:'var(--white)' }}>{c.v}</div>
                    </div>
                  ))}
                </div>

                {/* OTP — only show after driver accepts */}
                {activeRide.otp && ['accepted','driver_arriving','in_progress'].includes(activeRide.status) && (
                  <div style={{ background:'rgba(232,255,71,0.08)', border:'2px solid var(--accent)', borderRadius:'10px', padding:'12px 16px', marginBottom:'14px', textAlign:'center' }}>
                    <div style={{ fontSize:'11px', color:'var(--gray-400)', marginBottom:'4px' }}>🔐 Ride OTP — share ONLY when driver arrives</div>
                    <div style={{ fontSize:'28px', fontWeight:800, color:'var(--accent)', letterSpacing:'8px', fontFamily:'Syne' }}>
                      {activeRide.otp}
                    </div>
                  </div>
                )}

                {/* Driver info */}
                {activeRide.driverId?.userId && (
                  <div style={{ background:'rgba(232,255,71,0.05)', border:'1px solid rgba(232,255,71,0.15)', borderRadius:'10px', padding:'12px', marginBottom:'14px' }}>
                    <div style={{ fontSize:'11px', color:'var(--gray-400)', marginBottom:'8px' }}>Your Driver</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'#0a0a0a', fontWeight:700 }}>
                        {activeRide.driverId.userId.name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight:600 }}>{activeRide.driverId.userId.name}</div>
                        <div style={{ fontSize:'12px', color:'var(--gray-400)' }}>
                          ⭐ {activeRide.driverId.rating} · {activeRide.driverId.userId.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {['requested','accepted','driver_arriving'].includes(activeRide.status) && (
                  <Button variant="danger" onClick={cancelRide} loading={loading.cancel} style={{ width:'100%' }}>
                    <XCircle size={15}/> Cancel Ride
                  </Button>
                )}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'40px', color:'var(--gray-400)' }}>
                <Car size={44} style={{ marginBottom:'14px', opacity:0.3 }}/>
                <div style={{ fontSize:'16px', fontWeight:600, marginBottom:'6px' }}>No Active Ride</div>
                <p style={{ fontSize:'13px' }}>Book a ride to see it here</p>
                <Button onClick={() => setTab('book')} style={{ marginTop:'16px' }} size="sm">Book Now</Button>
              </div>
            )}
          </Card>

          {/* Live map */}
          {activeRide && (
            <Card style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontWeight:700, fontSize:'15px' }}>🗺 Live Tracking</h3>
                {driverLoc && <span style={{ fontSize:'12px', color:'var(--success)' }}>● Driver located</span>}
              </div>
              <RideMap
                pickup={activeRide.pickupLocation}
                drop={activeRide.dropLocation}
                driverLocation={driverLoc}
                style={{ height:'420px', borderRadius:0, border:'none' }}
              />
            </Card>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ──────────────────────────────────── */}
      {tab === 'history' && (
        <Card>
          <h3 style={{ marginBottom:'18px', fontWeight:700 }}>Ride History</h3>
          {rideHistory.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px', color:'var(--gray-400)' }}>
              <History size={44} style={{ marginBottom:'14px', opacity:0.3 }}/>
              <div>No rides yet</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {rideHistory.map(ride => (
                <div key={ride._id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px', background:'#1a1a1a', borderRadius:'10px', border:'1px solid var(--border)' }}>
                  <div style={{ width:40, height:40, borderRadius:'10px', background:'rgba(232,255,71,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Car size={18} color="var(--accent)"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'13px' }}>
                      {ride.pickupLocation?.address} → {ride.dropLocation?.address}
                    </div>
                    <div style={{ fontSize:'11px', color:'var(--gray-400)', marginTop:'3px' }}>
                      {new Date(ride.createdAt).toLocaleDateString()} · {ride.distance}km
                    </div>
                  </div>
                  <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'5px' }}>
                    <div style={{ fontWeight:700 }}>₹{ride.fare}</div>
                    <Badge status={ride.status}/>
                    {ride.status === 'completed' && !ride.rating && (
                      <button onClick={() => setReviewRide(ride)} style={{
                        fontSize:'11px', color:'var(--accent)', background:'none',
                        border:'1px solid rgba(232,255,71,0.3)', borderRadius:'6px',
                        padding:'3px 8px', cursor:'pointer',
                      }}>⭐ Rate</button>
                    )}
                    {ride.rating && (
                      <span style={{ fontSize:'11px', color:'var(--warning)' }}>
                        {'⭐'.repeat(ride.rating)}
                      </span>
                    )}
                    {/* ✅ Report button — available on all completed rides */}
                    {ride.status === 'completed' && (
                      <button onClick={() => setComplaintRide(ride)} style={{
                        fontSize:'11px', color:'#e74c3c', background:'none',
                        border:'1px solid rgba(231,76,60,0.35)', borderRadius:'6px',
                        padding:'3px 8px', cursor:'pointer',
                      }}>⚠ Report</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Review modal */}
      {reviewRide && (
        <ReviewModal
          ride={reviewRide}
          onClose={() => setReviewRide(null)}
          onSubmitted={() => { setReviewRide(null); fetchHistory(); }}
        />
      )}

      {/* Complaint modal */}
      {complaintRide && (
        <ComplaintModal
          ride={complaintRide}
          onClose={() => setComplaintRide(null)}
          onSubmitted={() => setComplaintRide(null)}
        />
      )}
    </div>
  );
}
