const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/rideController');

router.post('/estimate', protect, ctrl.getFareEstimate);
router.post('/request', protect, authorize('rider'), ctrl.rideValidation, validate, ctrl.requestRide);
router.get('/my-rides', protect, ctrl.getRiderRides);
router.get('/active', protect, ctrl.getActiveRide);
router.put('/:id/cancel', protect, ctrl.cancelRide);
router.put('/:id/rate', protect, ctrl.rateRide);

// Driver routes
router.get('/available', protect, authorize('driver'), ctrl.getAvailableRides);
router.get('/driver-rides', protect, authorize('driver'), ctrl.getDriverRides);
router.put('/:id/accept', protect, authorize('driver'), ctrl.acceptRide);
router.put('/:id/status', protect, authorize('driver'), ctrl.updateRideStatus);

module.exports = router;
