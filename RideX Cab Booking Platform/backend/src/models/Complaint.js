const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  rideId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Ride'   },
  driverId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }, // populated from ride
  subject:     { type: String, required: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ['rude_behavior','overcharging','wrong_route','vehicle_condition','safety','other'], default: 'other' },
  status:      { type: String, enum: ['open','in_review','resolved','closed'], default: 'open' },
  adminNote:   { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
