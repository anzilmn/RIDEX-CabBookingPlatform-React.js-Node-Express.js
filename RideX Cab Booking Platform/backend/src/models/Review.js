const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, unique: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, default: '', maxlength: 500 },
  tags: [{ type: String, enum: ['punctual','clean_car','safe_driving','friendly','professional','good_route','smooth_ride'] }],
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
