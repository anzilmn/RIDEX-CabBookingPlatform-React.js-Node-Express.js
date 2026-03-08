import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Users, Car, TrendingUp, DollarSign, CheckCircle, XCircle, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';

export default function AdminDashboard() {
  const { socket } = useSocket();
  const [tab, setTab]           = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [riders,    setRiders]    = useState([]);
  const [drivers,   setDrivers]   = useState([]);
  const [rides,     setRides]     = useState([]);
  const [complaints,setComplaints]= useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState({});
  const [driverFilter, setDriverFilter] = useState('all');
  const [newNotifCount, setNewNotifCount] = useState(0);

  useEffect(() => { fetchAll(); }, []);

  // ✅ Real-time admin notifications (new rider/driver/complaint)
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      if (['admin_new_rider','admin_new_driver','admin_new_complaint'].includes(notif.type)) {
        setNewNotifCount(c => c + 1);
        toast(notif.title + ' — ' + notif.message, {
          icon: notif.icon,
          style: { background:'#1a1a1a', color:'#fff', border:'1px solid #333' },
          duration: 6000,
        });
        // Auto-refresh relevant tab data
        if (notif.type === 'admin_new_rider')     fetchRiders();
        if (notif.type === 'admin_new_driver')    fetchDrivers();
        if (notif.type === 'admin_new_complaint') fetchComplaints();
      }
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  const fetchAll = async () => {
    try {
      const [a,r,d,ri,c] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/riders?limit=100'),
        api.get('/admin/drivers?limit=100'),
        api.get('/admin/rides?limit=100'),
        api.get('/admin/complaints'),
      ]);
      setAnalytics(a.data.analytics);
      setRiders(r.data.users||[]);
      setDrivers(d.data.drivers||[]);
      setRides(ri.data.rides||[]);
      setComplaints(c.data.complaints||[]);
    } catch { toast.error('Failed to load data'); }
  };

  const fetchRiders     = async () => { try { const {data} = await api.get('/admin/riders?limit=100');     setRiders(data.users||[]);    } catch {} };
  const fetchDrivers    = async () => { try { const {data} = await api.get('/admin/drivers?limit=100');    setDrivers(data.drivers||[]); } catch {} };
  const fetchComplaints = async () => { try { const {data} = await api.get('/admin/complaints');           setComplaints(data.complaints||[]); } catch {} };

  const setLoad = (k,v) => setLoading(l=>({...l,[k]:v}));

  const approveDriver = async (driverId, approve) => {
    setLoad(driverId,true);
    try { await api.put(`/admin/drivers/${driverId}/approve`,{approve}); toast.success(`Driver ${approve?'approved':'rejected'}`); fetchAll(); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setLoad(driverId,false); }
  };

  const blockUser = async (userId, block, reason = 'Policy violation') => {
    setLoad(userId+'_block',true);
    try {
      await api.put(`/admin/users/${userId}/block`,{ block, reason, timed: true });
      toast.success(`User ${block?'blocked for 23h':'unblocked'}`);
      fetchAll();
    } catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setLoad(userId+'_block',false); }
  };

  const deleteUser = async (userId) => {
    if(!window.confirm('Delete this user permanently?')) return;
    setLoad(userId+'_del',true);
    try { await api.delete(`/admin/users/${userId}`); toast.success('Deleted'); fetchAll(); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setLoad(userId+'_del',false); }
  };

  const resolveComplaint = async (id, status, adminNote='') => {
    setLoad(id+'_res',true);
    try { await api.put(`/admin/complaints/${id}`,{status,adminNote}); toast.success('Complaint updated'); fetchComplaints(); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setLoad(id+'_res',false); }
  };

  // ✅ Block driver directly from a complaint
  const blockDriverFromComplaint = async (complaintId, reason) => {
    setLoad(complaintId+'_bk',true);
    try {
      await api.put(`/admin/complaints/${complaintId}/block-driver`,{ reason, timed: true });
      toast.success('Driver blocked for 23h');
      fetchComplaints(); fetchDrivers();
    } catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setLoad(complaintId+'_bk',false); }
  };

  const filteredRiders = riders.filter(r =>
    search ? r.name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()) : true
  );
  const filteredDrivers = drivers.filter(d =>
    driverFilter==='approved' ? d.isApproved :
    driverFilter==='pending'  ? !d.isApproved : true
  );

  const openComplaints = complaints.filter(c => c.status === 'open').length;

  const tabs = [
    { id:'analytics',  label:'📊 Analytics' },
    { id:'riders',     label:'👤 Riders' },
    { id:'drivers',    label:'🚗 Drivers' },
    { id:'rides',      label:'🗺 Rides' },
    { id:'complaints', label:`⚠ Complaints${openComplaints>0?' ('+openComplaints+')':''}` },
  ];

  const statusColor = { open:'#e74c3c', in_review:'#f39c12', resolved:'#2ecc71', closed:'#555' };

  return (
    <div style={{paddingTop:'64px',minHeight:'100vh',padding:'80px 24px 40px',maxWidth:'1200px',margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'28px'}}>
        <div style={{width:44,height:44,background:'var(--accent)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Shield size={22} color="#0a0a0a"/>
        </div>
        <div>
          <h1 style={{fontSize:'26px',fontWeight:800}}>Admin Control Center</h1>
          <p style={{color:'var(--gray-400)',fontSize:'14px'}}>Manage the entire RideX platform</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'6px',marginBottom:'24px',overflowX:'auto',background:'#111',padding:'6px',borderRadius:'12px',border:'1px solid var(--border)'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'10px 20px',borderRadius:'8px',border:'none',cursor:'pointer',
            fontSize:'13px',fontWeight:600,whiteSpace:'nowrap',transition:'all 0.2s',
            background:tab===t.id?'var(--accent)':'transparent',
            color:tab===t.id?'#0a0a0a':'var(--gray-400)',
            position:'relative',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ANALYTICS */}
      {tab==='analytics' && analytics && (
        <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px'}}>
            <StatCard icon={<Users size={20}/>}       label="Total Riders"  value={analytics.totalRiders}/>
            <StatCard icon={<Car size={20}/>}          label="Total Drivers" value={analytics.totalDrivers}  color="var(--info)"/>
            <StatCard icon={<TrendingUp size={20}/>}   label="Total Rides"   value={analytics.totalRides}    color="var(--success)"/>
            <StatCard icon={<DollarSign size={20}/>}   label="Revenue"       value={`₹${(analytics.totalRevenue||0).toLocaleString()}`} color="var(--warning)"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px'}}>
            <StatCard icon={<Car size={20}/>}          label="Today's Rides" value={analytics.todayRides}/>
            <StatCard icon={<CheckCircle size={20}/>}  label="Completed"     value={analytics.completedRides}  color="var(--success)"/>
            <StatCard icon={<XCircle size={20}/>}      label="Cancelled"     value={analytics.cancelledRides}  color="var(--danger)"/>
            <StatCard icon={<AlertTriangle size={20}/>}label="Open Complaints" value={analytics.openComplaints||0} color="var(--danger)"/>
          </div>
          <Card>
            <h3 style={{fontWeight:700,marginBottom:'20px'}}>Rides — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.last7DaysRides||[]} barSize={32}>
                <XAxis dataKey="date" tick={{fill:'#999',fontSize:12}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#999',fontSize:12}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',color:'#fff'}}/>
                <Bar dataKey="rides" radius={[6,6,0,0]}>
                  {(analytics.last7DaysRides||[]).map((_,i)=>(
                    <Cell key={i} fill={i===6?'var(--accent)':'#2a2a2a'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* RIDERS */}
      {tab==='riders' && (
        <Card>
          <div style={{display:'flex',gap:'14px',marginBottom:'20px',alignItems:'center'}}>
            <h3 style={{fontWeight:700}}>Riders ({filteredRiders.length})</h3>
            <input style={{maxWidth:'280px'}} placeholder="Search by name or email..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Name','Email','Phone','Status','Actions'].map(h=>(
                    <th key={h} style={{padding:'12px 16px',textAlign:'left',color:'var(--gray-400)',fontWeight:600,fontSize:'12px',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRiders.map(rider=>(
                  <tr key={rider._id} style={{borderBottom:'1px solid #1a1a1a'}}>
                    <td style={{padding:'14px 16px',fontWeight:600}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(232,255,71,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'var(--accent)'}}>{rider.name?.[0]}</div>
                        {rider.name}
                      </div>
                    </td>
                    <td style={{padding:'14px 16px',color:'var(--gray-400)'}}>{rider.email}</td>
                    <td style={{padding:'14px 16px',color:'var(--gray-400)'}}>{rider.phone}</td>
                    <td style={{padding:'14px 16px'}}>
                      <div>
                        <Badge status={rider.isBlocked?'cancelled':'completed'} label={rider.isBlocked?'Blocked':'Active'}/>
                        {rider.isBlocked && rider.blockedUntil && (
                          <div style={{fontSize:'10px',color:'var(--gray-400)',marginTop:'3px'}}>
                            Until: {new Date(rider.blockedUntil).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{padding:'14px 16px'}}>
                      <div style={{display:'flex',gap:'8px'}}>
                        <Button size="sm" variant={rider.isBlocked?'success':'secondary'} loading={loading[rider._id+'_block']}
                          onClick={()=>blockUser(rider._id,!rider.isBlocked)}>
                          {rider.isBlocked?'Unblock':'Block 23h'}
                        </Button>
                        <Button size="sm" variant="danger" loading={loading[rider._id+'_del']} onClick={()=>deleteUser(rider._id)}>
                          <Trash2 size={13}/>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* DRIVERS */}
      {tab==='drivers' && (
        <Card>
          <div style={{display:'flex',gap:'12px',marginBottom:'20px',alignItems:'center',flexWrap:'wrap'}}>
            <h3 style={{fontWeight:700}}>Drivers ({filteredDrivers.length})</h3>
            <div style={{display:'flex',gap:'8px'}}>
              {['all','pending','approved'].map(f=>(
                <button key={f} onClick={()=>setDriverFilter(f)} style={{
                  padding:'6px 14px',borderRadius:'8px',border:'1px solid',fontSize:'13px',fontWeight:600,cursor:'pointer',
                  borderColor:driverFilter===f?'var(--accent)':'var(--border)',
                  background:driverFilter===f?'rgba(232,255,71,0.1)':'transparent',
                  color:driverFilter===f?'var(--accent)':'var(--gray-400)',textTransform:'capitalize'
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {filteredDrivers.map(driver=>(
              <div key={driver._id} style={{background:'#1a1a1a',borderRadius:'10px',padding:'16px',border:`1px solid ${driver.userId?.isBlocked?'rgba(231,76,60,0.3)':'var(--border)'}`,display:'flex',alignItems:'center',gap:'16px'}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:driver.isApproved?'rgba(46,204,113,0.2)':'rgba(243,156,18,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:driver.isApproved?'var(--success)':'var(--warning)',flexShrink:0}}>
                  {driver.userId?.name?.[0]}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>{driver.userId?.name}
                    {driver.userId?.isBlocked && <span style={{fontSize:'11px',color:'#e74c3c',marginLeft:'8px',background:'rgba(231,76,60,0.1)',padding:'2px 7px',borderRadius:'4px'}}>🚫 Blocked</span>}
                  </div>
                  <div style={{fontSize:'12px',color:'var(--gray-400)'}}>{driver.userId?.email} · {driver.licenseNumber}</div>
                  {driver.vehicle && <div style={{fontSize:'12px',color:'var(--gray-400)',marginTop:'2px'}}>{driver.vehicle.brand} {driver.vehicle.model} · <span style={{color:'var(--accent)',textTransform:'capitalize'}}>{driver.vehicle.vehicleType}</span> · {driver.vehicle.vehicleNumber}</div>}
                  {driver.userId?.isBlocked && driver.userId?.blockReason && (
                    <div style={{fontSize:'11px',color:'rgba(231,76,60,0.7)',marginTop:'3px'}}>Reason: {driver.userId.blockReason}</div>
                  )}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',justifyContent:'flex-end'}}>
                  <Badge status={driver.isApproved?'approved':'pending'} label={driver.isApproved?'Approved':'Pending'}/>
                  {!driver.isApproved ? (
                    <>
                      <Button size="sm" variant="success" loading={loading[driver._id]} onClick={()=>approveDriver(driver._id,true)}><CheckCircle size={13}/> Approve</Button>
                      <Button size="sm" variant="danger"  loading={loading[driver._id]} onClick={()=>approveDriver(driver._id,false)}><XCircle size={13}/> Reject</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="danger" loading={loading[driver._id]} onClick={()=>approveDriver(driver._id,false)}>Revoke</Button>
                  )}
                  <Button size="sm" variant={driver.userId?.isBlocked?'success':'secondary'} loading={loading[driver.userId?._id+'_block']}
                    onClick={()=>blockUser(driver.userId?._id,!driver.userId?.isBlocked)}>
                    {driver.userId?.isBlocked?'Unblock':'Block 23h'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* RIDES */}
      {tab==='rides' && (
        <Card>
          <h3 style={{fontWeight:700,marginBottom:'20px'}}>All Rides ({rides.length})</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Rider','Route','Fare','Type','Status','Date'].map(h=>(
                    <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'var(--gray-400)',fontWeight:600,fontSize:'12px',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rides.map(ride=>(
                  <tr key={ride._id} style={{borderBottom:'1px solid #1a1a1a'}}>
                    <td style={{padding:'12px 14px',fontWeight:600}}>{ride.riderId?.name}</td>
                    <td style={{padding:'12px 14px',color:'var(--gray-400)',maxWidth:'200px'}}>
                      <div style={{fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ride.pickupLocation?.address} → {ride.dropLocation?.address}</div>
                    </td>
                    <td style={{padding:'12px 14px',fontWeight:700,color:'var(--accent)'}}>₹{ride.fare}</td>
                    <td style={{padding:'12px 14px',color:'var(--gray-400)',fontSize:'12px',textTransform:'capitalize'}}>{ride.vehicleType}</td>
                    <td style={{padding:'12px 14px'}}><Badge status={ride.status}/></td>
                    <td style={{padding:'12px 14px',color:'var(--gray-400)',fontSize:'12px'}}>{new Date(ride.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* COMPLAINTS */}
      {tab==='complaints' && (
        <Card>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <h3 style={{fontWeight:700}}>Complaints ({complaints.length})</h3>
            {openComplaints > 0 && (
              <span style={{background:'rgba(231,76,60,0.15)',color:'#e74c3c',fontSize:'12px',fontWeight:700,padding:'4px 12px',borderRadius:'20px',border:'1px solid rgba(231,76,60,0.3)'}}>
                {openComplaints} open
              </span>
            )}
          </div>
          {complaints.length===0 ? (
            <div style={{textAlign:'center',padding:'48px',color:'var(--gray-400)'}}>
              <div style={{fontSize:'40px',marginBottom:'12px'}}>✅</div>
              No complaints filed
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {complaints.map(c=>(
                <div key={c._id} style={{
                  background:'#1a1a1a', borderRadius:'12px', padding:'16px',
                  border:`1px solid ${c.status==='open'?'rgba(231,76,60,0.3)':'var(--border)'}`,
                }}>
                  {/* Header row */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:'15px',marginBottom:'3px'}}>{c.subject}</div>
                      <div style={{fontSize:'12px',color:'var(--gray-400)'}}>
                        By: <span style={{color:'var(--white)',fontWeight:500}}>{c.userId?.name}</span> · {new Date(c.createdAt).toLocaleDateString()}
                        {c.category && <span style={{marginLeft:'8px',textTransform:'capitalize',color:'#aaa'}}>[{c.category.replace('_',' ')}]</span>}
                      </div>
                    </div>
                    <span style={{
                      fontSize:'12px', fontWeight:700, padding:'4px 10px', borderRadius:'6px',
                      background:`${statusColor[c.status]}22`, color:statusColor[c.status], border:`1px solid ${statusColor[c.status]}44`,
                      textTransform:'capitalize', whiteSpace:'nowrap'
                    }}>{c.status}</span>
                  </div>

                  {/* Description */}
                  <div style={{fontSize:'13px',color:'var(--gray-400)',marginBottom:'10px',lineHeight:1.6,background:'#141414',borderRadius:'8px',padding:'10px 12px'}}>
                    {c.description}
                  </div>

                  {/* Ride info */}
                  {c.rideId && (
                    <div style={{fontSize:'11px',color:'#666',marginBottom:'10px'}}>
                      🚗 {c.rideId.pickupLocation?.address} → {c.rideId.dropLocation?.address} · ₹{c.rideId.fare}
                    </div>
                  )}

                  {/* Driver info */}
                  {c.driverId?.userId && (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(231,76,60,0.05)',border:'1px solid rgba(231,76,60,0.15)',borderRadius:'8px',padding:'10px 12px',marginBottom:'10px'}}>
                      <div style={{fontSize:'13px'}}>
                        <span style={{color:'var(--gray-400)'}}>Driver: </span>
                        <span style={{fontWeight:600}}>{c.driverId.userId.name}</span>
                        <span style={{color:'var(--gray-400)',marginLeft:'8px'}}>{c.driverId.userId.email}</span>
                        {c.driverId.userId.isBlocked && <span style={{color:'#e74c3c',marginLeft:'8px',fontSize:'12px'}}>🚫 Currently Blocked</span>}
                      </div>
                      {/* ✅ Block driver directly from complaint */}
                      {!c.driverId.userId.isBlocked && (
                        <Button
                          size="sm" variant="danger"
                          loading={loading[c._id+'_bk']}
                          onClick={() => blockDriverFromComplaint(c._id, `Complaint: ${c.subject}`)}
                        >
                          🚫 Block Driver 23h
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Admin note */}
                  {c.adminNote && (
                    <div style={{fontSize:'12px',color:'var(--gray-400)',marginBottom:'10px',background:'#0d0d0d',padding:'8px 12px',borderRadius:'6px',borderLeft:'2px solid #333'}}>
                      Admin note: {c.adminNote}
                    </div>
                  )}

                  {/* Actions */}
                  {c.status !== 'resolved' && c.status !== 'closed' && (
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                      {c.status === 'open' && (
                        <Button size="sm" variant="secondary" loading={loading[c._id+'_res']}
                          onClick={()=>resolveComplaint(c._id,'in_review','Under review by admin')}>
                          👁 Mark In Review
                        </Button>
                      )}
                      <Button size="sm" variant="success" loading={loading[c._id+'_res']}
                        onClick={()=>resolveComplaint(c._id,'resolved','Issue resolved by admin')}>
                        ✅ Resolve
                      </Button>
                      <Button size="sm" variant="secondary" loading={loading[c._id+'_res']}
                        onClick={()=>resolveComplaint(c._id,'closed','Complaint closed')}>
                        Close
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
