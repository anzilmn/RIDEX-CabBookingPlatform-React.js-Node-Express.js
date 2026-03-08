const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  licenseNumber: { type: String, required: [true,'License number required'], unique: true },
  licenseExpiry: { type: Date, required: [true,'License expiry required'] },
  documents: {
    license: { type: String, default: '' },
    idProof: { type: String, default: '' },
    insurance: { type: String, default: '' }
  },
  isApproved: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  currentLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' }
  },
  rating: { type: Number, default: 5.0, min: 1, max: 5 },
  totalRides: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  status: { type: String, enum: ['available','busy','offline'], default: 'offline' }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
