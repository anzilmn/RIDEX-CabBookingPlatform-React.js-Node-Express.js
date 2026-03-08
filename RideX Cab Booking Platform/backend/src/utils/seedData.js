const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Ride = require('../models/Ride');
const Payment = require('../models/Payment');

async function seedDatabase() {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) { console.log('DB already seeded'); return; }

    // Admin
    const adminPwd = await bcrypt.hash('admin', 12);
    const admin = await User.create({
      name: 'Admin', email: 'admin@ridex.com', password: adminPwd,
      phone: '9999999999', role: 'admin', isVerified: true
    });

    // Riders
    const riderPwd = await bcrypt.hash('rider123', 12);
    const riders = await User.insertMany([
      { name:'Arjun Kumar', email:'arjun@example.com', password:riderPwd, phone:'9876543210', role:'rider', isVerified:true },
      { name:'Priya Singh', email:'priya@example.com', password:riderPwd, phone:'9876543211', role:'rider', isVerified:true },
      { name:'Rahul Das', email:'rahul@example.com', password:riderPwd, phone:'9876543212', role:'rider', isVerified:true },
      { name:'Sneha Patel', email:'sneha@example.com', password:riderPwd, phone:'9876543213', role:'rider', isVerified:true },
    ]);

    // Drivers
    const driverPwd = await bcrypt.hash('driver123', 12);
    const driverUsers = await User.insertMany([
      { name:'Mohammed Anzil', email:'anzil@example.com', password:driverPwd, phone:'8765432101', role:'driver', isVerified:true },
      { name:'Vikram Nair', email:'vikram@example.com', password:driverPwd, phone:'8765432102', role:'driver', isVerified:true },
      { name:'Ravi Menon', email:'ravi@example.com', password:driverPwd, phone:'8765432103', role:'driver', isVerified:true },
    ]);

    const driverDocs = await Driver.insertMany([
      { userId:driverUsers[0]._id, licenseNumber:'KL01DC1234', licenseExpiry:new Date('2027-12-31'), isApproved:true, isOnline:true, rating:4.8, totalRides:234, totalEarnings:45200, status:'available', currentLocation:{lat:9.9312,lng:76.2673,address:'Ernakulam'} },
      { userId:driverUsers[1]._id, licenseNumber:'KL02DC5678', licenseExpiry:new Date('2026-11-30'), isApproved:true, isOnline:true, rating:4.6, totalRides:180, totalEarnings:38100, status:'available', currentLocation:{lat:9.9500,lng:76.2900,address:'Kakkanad'} },
      { userId:driverUsers[2]._id, licenseNumber:'KL03DC9012', licenseExpiry:new Date('2025-08-31'), isApproved:false, isOnline:false, rating:4.2, totalRides:56, totalEarnings:12000, status:'offline' },
    ]);

    await Vehicle.insertMany([
      { driverId:driverDocs[0]._id, userId:driverUsers[0]._id, vehicleNumber:'KL07AB1234', vehicleType:'sedan', brand:'Toyota', model:'Etios', year:2021, color:'White', capacity:4 },
      { driverId:driverDocs[1]._id, userId:driverUsers[1]._id, vehicleNumber:'KL07CD5678', vehicleType:'suv', brand:'Mahindra', model:'XUV500', year:2022, color:'Black', capacity:6 },
      { driverId:driverDocs[2]._id, userId:driverUsers[2]._id, vehicleNumber:'KL07EF9012', vehicleType:'auto', brand:'Bajaj', model:'RE', year:2020, color:'Yellow', capacity:3 },
    ]);

    // Rides
    const statuses = ['completed','completed','completed','cancelled','in_progress'];
    const rides = [];
    for (let i = 0; i < 12; i++) {
      const st = statuses[i % statuses.length];
      const rider = riders[i % riders.length];
      const driver = driverDocs[i % 2];
      const fare = Math.floor(Math.random()*400)+80;
      const r = await Ride.create({
        riderId: rider._id, driverId: driver._id,
        pickupLocation:{ address:'MG Road, Kochi', lat:9.9312+Math.random()*0.1, lng:76.2673+Math.random()*0.1 },
        dropLocation:{ address:'Edapally, Kochi', lat:9.9800+Math.random()*0.1, lng:76.3200+Math.random()*0.1 },
        vehicleType:'sedan', status: st, fare, distance:parseFloat((Math.random()*15+2).toFixed(2)),
        duration: Math.floor(Math.random()*40+10),
        paymentStatus: st==='completed'?'paid':'pending',
        rating: st==='completed' ? Math.floor(Math.random()*2)+4 : undefined,
        createdAt: new Date(Date.now() - i*86400000*Math.random()*5)
      });
      rides.push(r);
      if (st==='completed') {
        await Payment.create({
          rideId:r._id, riderId:rider._id, driverId:driver._id,
          amount:fare, method:'cash', status:'success',
          platformFee:Math.round(fare*0.15), driverEarning:Math.round(fare*0.85)
        });
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log('  Admin: admin@ridex.com / admin (or username: admin / pass: admin)');
    console.log('  Rider: arjun@example.com / rider123');
    console.log('  Driver: anzil@example.com / driver123');
  } catch(e) { console.error('Seed error:', e.message); }
}

module.exports = seedDatabase;
