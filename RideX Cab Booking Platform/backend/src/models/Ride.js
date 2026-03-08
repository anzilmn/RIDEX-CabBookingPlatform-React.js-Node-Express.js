const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  pickupLocation: {
    address: { type: String, required: [true,'Pickup address required'] },
    lat: { type: Number, required: [true,'Pickup lat required'] },
    lng: { type: Number, required: [true,'Pickup lng required'] }
  },
  dropLocation: {
    address: { type: String, required: [true,'Drop address required'] },
    lat: { type: Number, required: [true,'Drop lat required'] },
    lng: { type: Number, required: [true,'Drop lng required'] }
  },
  vehicleType: { type: String, enum: ['sedan','suv','hatchback','motorcycle','auto'], default: 'sedan' },
  status: {
    type: String,
    enum: ['requested','accepted','driver_arriving','in_progress','completed','cancelled'],
    default: 'requested'
  },
  fare: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash','card','wallet'], default: 'cash' },
  cancelReason: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  otp: { type: String },
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
