const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleNumber: { type: String, required: [true,'Vehicle number required'], unique: true, uppercase: true },
  vehicleType: { type: String, required: [true,'Vehicle type required'],
    enum: ['sedan','suv','hatchback','motorcycle','auto'] },
  brand: { type: String, required: [true,'Brand required'] },
  model: { type: String, required: [true,'Model required'] },
  year: { type: Number, required: [true,'Year required'], min: 2000, max: new Date().getFullYear()+1 },
  color: { type: String, required: [true,'Color required'] },
  capacity: { type: Number, default: 4 }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
