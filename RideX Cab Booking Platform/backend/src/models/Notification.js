const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'ride_requested', 'ride_accepted', 'driver_arriving', 'ride_started',
      'ride_completed', 'ride_cancelled', 'payment_received', 'review_received',
      'driver_approved', 'driver_rejected', 'account_blocked', 'new_ride_available'
    ],
    required: true
  },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  isRead: { type: Boolean, default: false },
  icon: { type: String, default: '🔔' },
  color: { type: String, default: '#e8ff47' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
