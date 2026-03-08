const { body } = require('express-validator');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

exports.driverProfileValidation = [
  body('licenseNumber').notEmpty().withMessage('Driving license required'),
  body('licenseExpiry').isISO8601().withMessage('Valid license expiry required'),
  body('vehicleNumber').notEmpty().withMessage('Vehicle number required'),
  body('vehicleType').isIn(['sedan','suv','hatchback','motorcycle','auto']).withMessage('Vehicle type required'),
  body('brand').notEmpty().withMessage('Vehicle brand required'),
  body('model').notEmpty().withMessage('Vehicle model required'),
  body('year').isInt({min:2000}).withMessage('Valid year required'),
  body('color').notEmpty().withMessage('Vehicle color required'),
];

exports.createProfile = async (req, res) => {
  try {
    const { licenseNumber, licenseExpiry, vehicleNumber, vehicleType, brand, model, year, color, capacity } = req.body;
    const existing = await Driver.findOne({ userId: req.user._id });
    if (existing) return res.status(400).json({ success:false, message:'Driver profile already exists' });
    const driver = await Driver.create({ userId:req.user._id, licenseNumber, licenseExpiry });
    await Vehicle.create({ driverId:driver._id, userId:req.user._id, vehicleNumber, vehicleType, brand, model, year, color, capacity });
    await driver.populate('userId','name email phone avatar');
    res.status(201).json({ success:true, message:'Driver profile created. Pending admin approval.', driver });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success:false, message:'License or vehicle number already registered' });
    res.status(500).json({ success:false, message:err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId:req.user._id }).populate('userId','name email phone avatar');
    if (!driver) return res.status(404).json({ success:false, message:'Driver profile not found' });
    const vehicle = await Vehicle.findOne({ driverId:driver._id });
    res.json({ success:true, driver, vehicle });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

exports.toggleOnline = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId:req.user._id });
    if (!driver) return res.status(404).json({ success:false, message:'Profile not found' });
    if (!driver.isApproved) return res.status(403).json({ success:false, message:'Not approved by admin yet' });
    driver.isOnline = !driver.isOnline;
    driver.status = driver.isOnline ? 'available' : 'offline';
    await driver.save();
    res.json({ success:true, message:`You are now ${driver.isOnline?'online':'offline'}`, isOnline:driver.isOnline });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId:req.user._id });
    if (!driver) return res.status(404).json({ success:false, message:'Profile not found' });
    const Payment = require('../models/Payment');
    const payments = await Payment.find({ driverId:driver._id, status:'success' })
      .populate('rideId','createdAt distance duration')
      .sort({ createdAt:-1 }).limit(50);
    const today = new Date(); today.setHours(0,0,0,0);
    const todayEarnings = payments.filter(p => new Date(p.createdAt) >= today).reduce((a,p)=>a+p.driverEarning,0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate()-7);
    const weekEarnings = payments.filter(p => new Date(p.createdAt) >= weekStart).reduce((a,p)=>a+p.driverEarning,0);
    res.json({ success:true, totalEarnings:driver.totalEarnings, todayEarnings, weekEarnings, payments });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};
