const User      = require('../models/User');
const Driver    = require('../models/Driver');
const Vehicle   = require('../models/Vehicle');
const Ride      = require('../models/Ride');
const Payment   = require('../models/Payment');
const Complaint = require('../models/Complaint');
const { notify } = require('../utils/notify');

exports.getAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalDrivers, totalRides, totalPayments] = await Promise.all([
      User.countDocuments({ role:'rider' }),
      Driver.countDocuments(),
      Ride.countDocuments(),
      Payment.aggregate([{ $match:{ status:'success' } }, { $group:{ _id:null, total:{ $sum:'$amount' } } }])
    ]);
    const today = new Date(); today.setHours(0,0,0,0);
    const [todayRides, activeDrivers, pendingDrivers, completedRides, cancelledRides, openComplaints] = await Promise.all([
      Ride.countDocuments({ createdAt:{ $gte:today } }),
      Driver.countDocuments({ isOnline:true }),
      Driver.countDocuments({ isApproved:false }),
      Ride.countDocuments({ status:'completed' }),
      Ride.countDocuments({ status:'cancelled' }),
      Complaint.countDocuments({ status:'open' }),
    ]);
    const last7 = [];
    for (let i=6;i>=0;i--) {
      const d=new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
      const next=new Date(d); next.setDate(next.getDate()+1);
      const count=await Ride.countDocuments({ createdAt:{ $gte:d, $lt:next } });
      last7.push({ date:d.toLocaleDateString('en-US',{weekday:'short'}), rides:count });
    }
    res.json({ success:true, analytics:{
      totalRiders:totalUsers, totalDrivers, totalRides, completedRides, cancelledRides,
      todayRides, activeDrivers, pendingDrivers, openComplaints,
      totalRevenue:totalPayments[0]?.total||0, last7DaysRides:last7
    }});
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.getAllRiders = async (req, res) => {
  try {
    const { page=1, limit=20, search } = req.query;
    const query = { role:'rider' };
    if (search) query.$or=[{ name:{$regex:search,$options:'i'} },{ email:{$regex:search,$options:'i'} }];
    const users = await User.find(query).select('-password').sort({ createdAt:-1 }).limit(limit*1).skip((page-1)*limit);
    const total = await User.countDocuments(query);
    res.json({ success:true, users, total, pages:Math.ceil(total/limit) });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.getAllDrivers = async (req, res) => {
  try {
    const { page=1, limit=20, approved } = req.query;
    const query = {};
    if (approved!==undefined) query.isApproved = approved==='true';
    const drivers = await Driver.find(query)
      .populate('userId','name email phone avatar isBlocked blockedUntil blockReason')
      .sort({ createdAt:-1 }).limit(limit*1).skip((page-1)*limit);
    const driversWithVehicle = await Promise.all(drivers.map(async d => {
      const vehicle = await Vehicle.findOne({ driverId:d._id });
      return { ...d.toObject(), vehicle };
    }));
    const total = await Driver.countDocuments(query);
    res.json({ success:true, drivers:driversWithVehicle, total, pages:Math.ceil(total/limit) });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.approveDriver = async (req, res) => {
  try {
    const io = req.app.locals.io;
    const { approve } = req.body;
    const driver = await Driver.findByIdAndUpdate(req.params.id, { isApproved:approve }, { new:true })
      .populate('userId','name email _id');
    if (!driver) return res.status(404).json({ success:false, message:'Driver not found' });
    if (driver.userId?._id) {
      await notify(io, driver.userId._id, approve ? 'driver_approved' : 'driver_rejected', null, {});
    }
    res.json({ success:true, message:`Driver ${approve?'approved':'rejected'}`, driver });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── BLOCK / UNBLOCK — with reason + optional 23-hour timed lock ──
exports.blockUser = async (req, res) => {
  try {
    const io = req.app.locals.io;
    const { block, reason = 'Policy violation', timed = true } = req.body;
    // timed=true (default) → 23h auto-unblock
    // timed=false          → permanent until admin manually unblocks
    const blockedUntil = (block && timed)
      ? new Date(Date.now() + 23 * 60 * 60 * 1000)
      : null;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: block, blockReason: block ? reason : '', blockedUntil: block ? blockedUntil : null },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success:false, message:'Cannot block admin' });

    if (block) {
      const untilStr = blockedUntil
        ? new Date(blockedUntil).toLocaleString('en-IN', { timeZone:'Asia/Kolkata' })
        : null;
      await notify(io, user._id, 'account_blocked', null, { extra: reason, extra2: untilStr });
    } else {
      await notify(io, user._id, 'account_unblocked', null, {});
    }

    res.json({ success:true, message:`User ${block?'blocked':'unblocked'}`, user });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    if (user.role==='admin') return res.status(400).json({ success:false, message:'Cannot delete admin' });
    await User.findByIdAndDelete(req.params.id);
    if (user.role==='driver') {
      const driver = await Driver.findOne({ userId:user._id });
      if (driver) { await Vehicle.deleteMany({ driverId:driver._id }); await driver.deleteOne(); }
    }
    res.json({ success:true, message:'User deleted' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.getAllRides = async (req, res) => {
  try {
    const { page=1, limit=20, status } = req.query;
    const query = {};
    if (status) query.status = status;
    const rides = await Ride.find(query)
      .populate('riderId','name email phone')
      .populate({ path:'driverId', populate:{ path:'userId', select:'name phone' } })
      .sort({ createdAt:-1 }).limit(limit*1).skip((page-1)*limit);
    const total = await Ride.countDocuments(query);
    res.json({ success:true, rides, total, pages:Math.ceil(total/limit) });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('userId','name email')
      .populate({ path:'driverId', populate:{ path:'userId', select:'name email isBlocked' } })
      .populate('rideId','pickupLocation dropLocation fare status')
      .sort({ createdAt:-1 });
    res.json({ success:true, complaints });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status, adminNote }, { new:true });
    res.json({ success:true, complaint });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── BLOCK DRIVER DIRECTLY FROM A COMPLAINT ───────────────────
exports.blockDriverFromComplaint = async (req, res) => {
  try {
    const io = req.app.locals.io;
    const { reason = 'Complaint filed against you', timed = true } = req.body;

    const complaint = await Complaint.findById(req.params.id).populate('driverId');
    if (!complaint?.driverId) return res.status(404).json({ success:false, message:'No driver linked to this complaint' });

    const blockedUntil = timed ? new Date(Date.now() + 23 * 60 * 60 * 1000) : null;
    const driverUserId = complaint.driverId.userId;

    await User.findByIdAndUpdate(driverUserId, {
      isBlocked: true, blockReason: reason, blockedUntil
    });

    // Mark complaint in_review
    await Complaint.findByIdAndUpdate(req.params.id, {
      status:'in_review', adminNote:`Driver blocked: ${reason}`
    });

    const untilStr = blockedUntil
      ? new Date(blockedUntil).toLocaleString('en-IN', { timeZone:'Asia/Kolkata' })
      : null;
    await notify(io, driverUserId, 'account_blocked', null, { extra: reason, extra2: untilStr });

    res.json({ success:true, message:'Driver blocked from complaint' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};
