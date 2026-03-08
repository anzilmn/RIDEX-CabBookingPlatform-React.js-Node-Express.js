const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProfile,getProfile,toggleOnline,getEarnings,driverProfileValidation } = require('../controllers/driverController');

router.post('/profile', protect, authorize('driver'), driverProfileValidation, validate, createProfile);
router.get('/profile', protect, authorize('driver'), getProfile);
router.put('/toggle-online', protect, authorize('driver'), toggleOnline);
router.get('/earnings', protect, authorize('driver'), getEarnings);
module.exports = router;
