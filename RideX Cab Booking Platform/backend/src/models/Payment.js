const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash','card','wallet'], default: 'cash' },
  status: { type: String, enum: ['pending','success','failed'], default: 'pending' },
  transactionId: { type: String, default: () => 'TXN' + Date.now() },
  platformFee: { type: Number, default: 0 },
  driverEarning: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
