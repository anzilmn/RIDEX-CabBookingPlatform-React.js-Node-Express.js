import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Car, DollarSign, Star, CheckCircle, Play, Navigation, X, MapPin } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import RideMap from '../components/RideMap';

export default function DriverDashboard() {
  const { user }   = useAuth();
  const { socket } = useSocket();

  const [driverProfile, setDriverProfile]   = useState(null);
  const [vehicle,        setVehicle]         = useState(null);
  const [availableRides, setAvailableRides]  = useState([]);
  const [myRides,        setMyRides]         = useState([]);
  const [earnings,       setEarnings]        = useState({ total: 0, today: 0, week: 0 });
  const [tab,            setTab]             = useState('rides');
  const [loading,        setLoading]         = useState({});
  const [needsProfile,   setNeedsProfile]    = useState(false);
  const [activeRide,     setActiveRide]      = useState(null);

  // Map: which ride card is expanded to show map (Available tab)
  const [previewRideId,  setPreviewRideId]   = useState(null);

  const [profileForm, setProfileForm] = useState({
    licenseNumber:'', licenseExpiry:'', vehicleNumber:'',
    vehicleType:'sedan', brand:'', model:'', year:2022, color:''
  });
  const [profileErrors, setProfileErrors] = useState({});

  // ── data loaders ───────────────────────────────────────────
  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (!driverProfile?.isApproved) return;
    fetchAvailableRides(); fetchMyRides(); fetchEarnings();
    const t = setInterval(() => {
      // Only poll if driver is online
      if (driverProfile?.isOnline) fetchAvailableRides();
    }, 12000);
    return () => clearInterval(t);
  }, [driverProfile?.isApproved, driverProfile?.isOnline]);

  // ── socket events ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      if (notif.type === 'new_ride_available')  { fetchAvailableRides(); }
      if (notif.type === 'rider_cancelled')     { toast.error('Rider cancelled'); fetchMyRides(); setActiveRide(null); }
      if (notif.type === 'driver_approved')     { fetchProfile(); toast.success('🎉 Account approved!'); }
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/driver/profile');
      setDriverProfile(data.driver); setVehicle(data.vehicle);
    } catch (err) { if (err.response?.status === 404) setNeedsProfile(true); }
  };

  const fetchAvailableRides = async () => {
    try { const { data } = await api.get('/rides/available'); setAvailableRides(data.rides || []); } catch {}
  };

  const fetchMyRides = async () => {
    try { const { data } = await api.get('/rides/driver-rides'); setMyRides(data.rides || []); } catch {}
  };

  const fetchEarnings = async () => {
    try { const { data } = await api.get('/driver/earnings'); setEarnings({ total: data.totalEarnings, today: data.todayEarnings, week: data.weekEarnings }); } catch {}
  };

  const setLoad = (k, v) => setLoading(l => ({ ...l, [k]: v }));

  // ── profile creation ───────────────────────────────────────
  const validateProfile = () => {
    const e = {};
    if (!profileForm.licenseNumber) e.licenseNumber = 'Required';
    if (!profileForm.licenseExpiry) e.licenseExpiry = 'Required';
    if (!profileForm.vehicleNumber) e.vehicleNumber = 'Required';
    if (!profileForm.brand)         e.brand         = 'Required';
    if (!profileForm.model)         e.model         = 'Required';
    if (!profileForm.color)         e.color         = 'Required';
    setProfileErrors(e);
    return Object.keys(e).length === 0;
  };

  const createProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setLoad('profile', true);
    try {
      await api.post('/driver/profile', profileForm);
      toast.success('Profile submitted! Awaiting admin approval.');
      fetchProfile(); setNeedsProfile(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoad('profile', false); }
  };

  // ── toggle online ──────────────────────────────────────────
  const toggleOnline = async () => {
    setLoad('online', true);
    try {
      const { data } = await api.put('/driver/toggle-online');
      setDriverProfile(p => ({ ...p, isOnline: data.isOnline }));
      toast.success(data.message);
      // If just went online, refresh available rides
      if (data.isOnline) fetchAvailableRides();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoad('online', false); }
  };

  // ── accept ride ────────────────────────────────────────────
  const acceptRide = async (rideId) => {
    setLoad(rideId, true);
    try {
      const { data } = await api.put(`/rides/${rideId}/accept`);
      toast.success('✅ Ride accepted! OTP sent to both you and the rider.');
      setActiveRide(data.ride);
      setPreviewRideId(null);
      fetchAvailableRides(); fetchMyRides(); setTab('myrides');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoad(rideId, false); }
  };

  // ── update status ──────────────────────────────────────────
  const updateStatus = async (rideId, status) => {
    setLoad(rideId + '_s', true);
    try {
      const { data } = await api.put(`/rides/${rideId}/status`, { status });
      const labels = { driver_arriving: "On the way to pickup 📍", in_progress: "Ride started! 🚗", completed: "Ride completed! 🏁" };
      toast.success(labels[status] || 'Updated');
      fetchMyRides();
      if (status === 'completed') { fetchEarnings(); setActiveRide(null); }
      else { setActiveRide(data.ride); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoad(rideId + '_s', false); }
  };

  // ── profile setup page ─────────────────────────────────────
  if (needsProfile) return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', padding: '80px 24px 40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>Setup Driver Profile</h1>
      <p style={{ color: 'var(--gray-400)', marginBottom: '24px', fontSize: '14px' }}>Complete your profile to start accepting rides</p>
      <Card>
        <form onSubmit={createProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontWeight: 700 }}>License Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { key: 'licenseNumber', label: 'License Number *', placeholder: 'KL01DC1234' },
              { key: 'licenseExpiry', label: 'Expiry Date *', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', color: 'var(--gray-400)', display: 'block', marginBottom: '5px' }}>{f.label}</label>
                <input type={f.type || 'text'} placeholder={f.placeholder} value={profileForm[f.key]}
                  onChange={e => setProfileForm({ ...profileForm, [f.key]: e.target.value })} />
                {profileErrors[f.key] && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{profileErrors[f.key]}</span>}
              </div>
            ))}
          </div>
          <h3 style={{ fontWeight: 700, marginTop: '4px' }}>Vehicle Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { key: 'vehicleNumber', label: 'Vehicle Number *', placeholder: 'KL07AB1234', upper: true },
              { key: 'brand',         label: 'Brand *',          placeholder: 'Toyota' },
              { key: 'model',         label: 'Model *',          placeholder: 'Etios' },
              { key: 'color',         label: 'Color *',          placeholder: 'White' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', color: 'var(--gray-400)', display: 'block', marginBottom: '5px' }}>{f.label}</label>
                <input placeholder={f.placeholder} value={profileForm[f.key]}
                  onChange={e => setProfileForm({ ...profileForm, [f.key]: f.upper ? e.target.value.toUpperCase() : e.target.value })} />
                {profileErrors[f.key] && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{profileErrors[f.key]}</span>}
              </div>
            ))}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--gray-400)', display: 'block', marginBottom: '5px' }}>Vehicle Type *</label>
              <select value={profileForm.vehicleType} onChange={e => setProfileForm({ ...profileForm, vehicleType: e.target.value })}>
                {['sedan','suv','hatchback','motorcycle','auto'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--gray-400)', display: 'block', marginBottom: '5px' }}>Year *</label>
              <input type="number" min="2000" max="2025" value={profileForm.year}
                onChange={e => setProfileForm({ ...profileForm, year: parseInt(e.target.value) })} />
            </div>
          </div>
          <Button type="submit" loading={loading.profile} style={{ marginTop: '4px' }}>Submit Profile</Button>
        </form>
      </Card>
    </div>
  );

  // ── main dashboard ─────────────────────────────────────────
  const previewRide = availableRides.find(r => r._id === previewRideId) || null;

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', padding: '80px 24px 40px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Driver Hub</h1>
          <p style={{ color: 'var(--gray-400)', fontSize: '13px', marginTop: '3px' }}>
            {driverProfile?.isApproved ? '✅ Approved · Ready to ride' : '⏳ Awaiting admin approval'}
          </p>
        </div>
        {driverProfile?.isApproved && (
          <button onClick={toggleOnline} disabled={loading.online} style={{
            padding: '10px 22px', borderRadius: '10px', border: '1px solid',
            borderColor: driverProfile?.isOnline ? 'var(--success)' : 'var(--border)',
            background:  driverProfile?.isOnline ? 'rgba(46,204,113,0.1)' : '#1a1a1a',
            color:       driverProfile?.isOnline ? 'var(--success)' : 'var(--gray-400)',
            fontWeight: 700, cursor: 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: driverProfile?.isOnline ? 'var(--success)' : '#555', display: 'inline-block' }} />
            {driverProfile?.isOnline ? 'Online' : 'Offline'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
        <StatCard icon={<DollarSign size={18}/>} label="Total Earnings" value={`₹${earnings.total.toLocaleString()}`} />
        <StatCard icon={<DollarSign size={18}/>} label="Today"          value={`₹${earnings.today}`}                  color="var(--success)" />
        <StatCard icon={<Car        size={18}/>} label="Total Rides"    value={driverProfile?.totalRides || 0}          color="var(--info)" />
        <StatCard icon={<Star       size={18}/>} label="Rating"         value={driverProfile?.rating || '—'}            color="var(--warning)" />
      </div>

      {/* Pending approval banner */}
      {!driverProfile?.isApproved && (
        <div style={{ padding: '16px', background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.3)', borderRadius: '12px', marginBottom: '20px', color: 'var(--warning)', fontSize: '14px' }}>
          ⏳ Your profile is pending admin approval. You'll get a notification when approved.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', background: '#111', padding: '5px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        {[
          { id: 'rides',       label: 'Available Rides' },
          { id: 'myrides',     label: 'My Rides'        },
          { id: 'earnings_tab',label: 'Earnings'        },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
            background: tab === t.id ? 'var(--accent)' : 'transparent',
            color:      tab === t.id ? '#0a0a0a'       : 'var(--gray-400)',
          }}>
            {t.label}
            {t.id === 'rides' && availableRides.length > 0 && ` (${availableRides.length})`}
          </button>
        ))}
      </div>

      {/* ── AVAILABLE RIDES TAB ───────────────────────────── */}
      {tab === 'rides' && (
        <div style={{ display: 'grid', gridTemplateColumns: previewRide ? '420px 1fr' : '1fr', gap: '18px', alignItems: 'start' }}>

          {/* Ride list */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 700 }}>
                Available{availableRides.length > 0 ? ` (${availableRides.length})` : ''}
              </h3>
              <Button variant="secondary" size="sm" onClick={fetchAvailableRides}>↻ Refresh</Button>
            </div>

            {/* States */}
            {!driverProfile?.isApproved ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)', fontSize: '13px' }}>
                Approval required to see rides
              </div>
            ) : !driverProfile?.isOnline ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '14px' }}>🚗</div>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>You're Offline</div>
                <div style={{ color: 'var(--gray-400)', fontSize: '13px', marginBottom: '18px' }}>
                  Go online to start receiving ride requests
                </div>
                <Button onClick={toggleOnline} loading={loading.online} size="sm">Go Online</Button>
              </div>
            ) : availableRides.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
                No rides available right now. Check back soon!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {availableRides.map(ride => {
                  const isSel = ride._id === previewRideId;
                  return (
                    <div key={ride._id} style={{
                      background:   isSel ? 'rgba(232,255,71,0.06)' : '#1a1a1a',
                      border:       `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '12px', padding: '14px', transition: 'all 0.2s',
                    }}>
                      {/* Rider info + fare */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0a', fontWeight: 800, fontSize: '14px' }}>
                            {ride.riderId?.name?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{ride.riderId?.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--gray-400)', textTransform: 'capitalize' }}>{ride.vehicleType}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '15px' }}>₹{ride.fare}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{ride.distance}km</div>
                        </div>
                      </div>

                      {/* Route */}
                      <div style={{ fontSize: '12px', color: 'var(--gray-400)', background: '#0f0f0f', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px', lineHeight: 1.7 }}>
                        <span style={{ color: '#e8ff47' }}>📍</span> {ride.pickupLocation?.address}<br/>
                        <span style={{ color: '#e74c3c' }}>🏁</span> {ride.dropLocation?.address}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '7px' }}>
                        {/* Map preview toggle */}
                        <button
                          onClick={() => setPreviewRideId(isSel ? null : ride._id)}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                            borderColor: isSel ? 'var(--accent)' : '#333',
                            background:  isSel ? 'rgba(232,255,71,0.1)' : 'transparent',
                            color:       isSel ? 'var(--accent)' : 'var(--gray-400)',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          }}
                        >
                          {isSel ? <><X size={13}/> Hide Map</> : <><MapPin size={13}/> View Map</>}
                        </button>

                        {/* Accept */}
                        <Button
                          onClick={() => acceptRide(ride._id)}
                          loading={loading[ride._id]}
                          style={{ flex: 2 }} size="sm"
                        >
                          <CheckCircle size={14}/> Accept Ride
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ── MAP — only shown when a ride is clicked ── */}
          {previewRide && (
            <Card style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: '80px' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '15px' }}>🗺 Route Preview</h3>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>
                    {previewRide.pickupLocation?.address} → {previewRide.dropLocation?.address}
                  </div>
                </div>
                <button
                  onClick={() => setPreviewRideId(null)}
                  style={{ background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--gray-400)', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <X size={12}/> Close
                </button>
              </div>
              <RideMap
                pickup={previewRide.pickupLocation}
                drop={previewRide.dropLocation}
                style={{ height: '460px', borderRadius: 0, border: 'none' }}
              />
              {/* Quick accept from map panel */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#0d0d0d' }}>
                <Button
                  onClick={() => acceptRide(previewRide._id)}
                  loading={loading[previewRide._id]}
                  style={{ width: '100%' }}
                >
                  <CheckCircle size={15}/> Accept This Ride — ₹{previewRide.fare}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── MY RIDES TAB ──────────────────────────────────── */}
      {tab === 'myrides' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeRide ? '1fr 1fr' : '1fr', gap: '18px' }}>
          <Card>
            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>My Rides</h3>
            {myRides.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>No rides yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myRides.map(ride => (
                  <div key={ride._id} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '14px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>
                        {ride.pickupLocation?.address} → {ride.dropLocation?.address}
                      </div>
                      <Badge status={ride.status} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '10px' }}>
                      ₹{ride.fare} · {ride.distance}km · Rider: {ride.riderId?.name}
                    </div>

                    {/* ✅ OTP box — show prominently for active rides */}
                    {['accepted','driver_arriving','in_progress'].includes(ride.status) && ride.otp && (
                      <div style={{
                        background: 'rgba(232,255,71,0.08)', border: '1px solid rgba(232,255,71,0.3)',
                        borderRadius: '10px', padding: '10px 14px', marginBottom: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '2px' }}>
                            🔑 Verify OTP with rider before starting
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '6px' }}>
                            {ride.otp}
                          </div>
                        </div>
                        <div style={{ fontSize: '28px' }}>🔐</div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {['accepted','driver_arriving','in_progress'].includes(ride.status) && (
                      <div style={{ display: 'flex', gap: '7px' }}>
                        {ride.status === 'accepted' && (
                          <Button size="sm" onClick={() => updateStatus(ride._id, 'driver_arriving')} loading={loading[ride._id + '_s']} style={{ flex: 1 }}>
                            <Navigation size={13}/> I'm Arriving
                          </Button>
                        )}
                        {ride.status === 'driver_arriving' && (
                          <Button size="sm" onClick={() => updateStatus(ride._id, 'in_progress')} loading={loading[ride._id + '_s']} style={{ flex: 1 }}>
                            <Play size={13}/> Start Ride
                          </Button>
                        )}
                        {ride.status === 'in_progress' && (
                          <Button size="sm" variant="success" onClick={() => updateStatus(ride._id, 'completed')} loading={loading[ride._id + '_s']} style={{ flex: 1 }}>
                            <CheckCircle size={13}/> Complete Ride
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active ride map */}
          {activeRide && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontWeight: 700, fontSize: '15px' }}>🗺 Current Ride Route</h3>
              </div>
              <RideMap
                pickup={activeRide.pickupLocation}
                drop={activeRide.dropLocation}
                style={{ height: '420px', borderRadius: 0, border: 'none' }}
              />
            </Card>
          )}
        </div>
      )}

      {/* ── EARNINGS TAB ──────────────────────────────────── */}
      {tab === 'earnings_tab' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          <Card>
            <h3 style={{ fontWeight: 700, marginBottom: '18px' }}>Earnings Summary</h3>
            {[
              { l: 'Total Earnings',   v: `₹${earnings.total.toLocaleString()}` },
              { l: "Today's Earnings", v: `₹${earnings.today}` },
              { l: 'This Week',        v: `₹${earnings.week}` },
              { l: 'Platform Fee',     v: '15%' },
              { l: 'Your Share',       v: '85%' },
            ].map(i => (
              <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--gray-400)', fontSize: '14px' }}>{i.l}</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{i.v}</span>
              </div>
            ))}
          </Card>
          {vehicle && (
            <Card>
              <h3 style={{ fontWeight: 700, marginBottom: '18px' }}>My Vehicle</h3>
              {[
                { l: 'Number', v: vehicle.vehicleNumber },
                { l: 'Type',   v: vehicle.vehicleType },
                { l: 'Brand',  v: vehicle.brand },
                { l: 'Model',  v: vehicle.model },
                { l: 'Color',  v: vehicle.color },
                { l: 'Year',   v: vehicle.year },
              ].map(i => (
                <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--gray-400)', fontSize: '14px' }}>{i.l}</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{i.v}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
