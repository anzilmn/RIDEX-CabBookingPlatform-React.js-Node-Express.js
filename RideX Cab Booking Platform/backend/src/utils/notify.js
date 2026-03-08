const Notification = require('../models/Notification');

const TEMPLATES = {
  ride_requested: (ride) => ({
    title: '🔍 Looking for Drivers...',
    message: `Pickup: ${ride?.pickupLocation?.address} → Drop: ${ride?.dropLocation?.address} · ₹${ride?.fare}`,
    icon: '🔍', color: '#e8ff47'
  }),
  ride_accepted: (ride, driverName, otp) => ({
    title: '✅ Driver Found!',
    message: `${driverName} accepted your ride. Your OTP is: ${otp} — share it only when driver arrives.`,
    icon: '✅', color: '#2ecc71'
  }),
  ride_accepted_driver: (ride, riderName, otp) => ({
    title: '🚖 Ride Confirmed!',
    message: `You accepted ${riderName}'s ride. Verify OTP: ${otp} from the rider before starting.`,
    icon: '🚖', color: '#e8ff47'
  }),
  driver_arriving: (x, driverName) => ({
    title: '📍 Driver is Arriving!',
    message: `${driverName} is arriving at your pickup. Please be ready! Share the OTP when they arrive.`,
    icon: '📍', color: '#3498db'
  }),
  ride_started: (ride) => ({
    title: '🚗 Ride Started!',
    message: `Your ride to ${ride?.dropLocation?.address} has started. Estimated: ${ride?.duration} mins.`,
    icon: '🚗', color: '#9b59b6'
  }),
  ride_started_driver: (x, riderName) => ({
    title: '🚗 Ride In Progress',
    message: `Ride with ${riderName} started. Drive safely and follow the route!`,
    icon: '🚗', color: '#3498db'
  }),

  // 🏁 Ride completed — prompts BOTH review AND complaint
  ride_completed: (ride) => ({
    title: '🏁 Ride Completed!',
    message: `Arrived at ${ride?.dropLocation?.address}. Fare: ₹${ride?.fare}. Rate your experience — or report an issue if anything went wrong.`,
    icon: '🏁', color: '#2ecc71'
  }),

  ride_completed_driver: (x, earning) => ({
    title: '✅ Ride Complete!',
    message: `Ride completed! You earned ₹${earning}. You are now available for new rides.`,
    icon: '✅', color: '#2ecc71'
  }),
  ride_cancelled: (reason) => ({
    title: '❌ Ride Cancelled',
    message: `Your ride was cancelled. Reason: ${typeof reason === 'string' ? reason : 'No reason provided'}`,
    icon: '❌', color: '#e74c3c'
  }),
  rider_cancelled: () => ({
    title: '❌ Rider Cancelled',
    message: 'The rider has cancelled their ride request. You are available for new rides.',
    icon: '❌', color: '#e74c3c'
  }),
  payment_received: (x, earning) => ({
    title: '💰 Payment Received!',
    message: `₹${earning} has been added to your earnings. Keep it up!`,
    icon: '💰', color: '#f39c12'
  }),
  review_received: (x, rating, riderName) => ({
    title: '⭐ New Review!',
    message: `${riderName} gave you a ${rating}-star rating. Great work!`,
    icon: '⭐', color: '#f39c12'
  }),
  driver_approved: () => ({
    title: '🎉 Account Approved!',
    message: 'Your driver account is approved! Go online to start accepting rides.',
    icon: '🎉', color: '#2ecc71'
  }),
  driver_rejected: () => ({
    title: '⚠ Application Needs Review',
    message: 'Your driver application needs further review. Contact support.',
    icon: '⚠', color: '#e74c3c'
  }),
  new_ride_available: (ride) => ({
    title: '🔔 New Ride Nearby!',
    message: `Pickup: ${ride?.pickupLocation?.address} · Fare: ₹${ride?.fare} · ${ride?.distance}km`,
    icon: '🔔', color: '#e8ff47'
  }),

  // ── NEW TEMPLATES ──────────────────────────────────────────

  // Blocked driver logs in — full reason + time remaining
  account_blocked: (x, reason, until) => ({
    title: '🚫 Account Blocked',
    message: `Your account has been blocked. Reason: ${reason || 'Policy violation'}.${until ? ` Auto-unblocks at: ${until}` : ' Contact support to appeal.'}`,
    icon: '🚫', color: '#e74c3c'
  }),
  account_unblocked: () => ({
    title: '✅ Account Unblocked',
    message: 'Your account has been unblocked by admin. You can use RideX normally again.',
    icon: '✅', color: '#2ecc71'
  }),

  // Rider gets confirmation after filing complaint
  complaint_filed: (x, subject) => ({
    title: '📋 Complaint Submitted',
    message: `Your complaint "${subject}" has been received. Admin will review it shortly.`,
    icon: '📋', color: '#3498db'
  }),

  // Admin gets notified for every event
  admin_new_rider: (x, name) => ({
    title: '👤 New Rider Joined!',
    message: `${name} just created a rider account on RideX.`,
    icon: '👤', color: '#3498db'
  }),
  admin_new_driver: (x, name) => ({
    title: '🚗 New Driver Applied!',
    message: `${name} submitted a driver application. Approve from the Drivers panel.`,
    icon: '🚗', color: '#f39c12'
  }),
  admin_new_complaint: (x, subject, riderName) => ({
    title: '⚠ New Complaint Filed!',
    message: `${riderName} filed a complaint: "${subject}". Review it in the Complaints panel.`,
    icon: '⚠', color: '#e74c3c'
  }),
};

async function notify(io, userId, type, rideId, data = {}) {
  try {
    const fn = TEMPLATES[type];
    if (!fn) return;

    const { title, message, icon, color } = fn(
      data.ride,
      data.extra,
      data.otp !== undefined ? data.otp : data.extra2
    );

    const notif = await Notification.create({
      userId, type, title, message, icon, color,
      rideId: rideId || null
    });

    if (io) {
      io.to(userId.toString()).emit('notification', {
        _id: notif._id, title, message, icon, color, type,
        rideId, isRead: false, createdAt: notif.createdAt
      });
    }
    return notif;
  } catch (err) {
    console.error('notify() error:', err.message);
  }
}

module.exports = { notify };
