const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');
const mid  = [protect, authorize('admin')];

router.get('/analytics',                       ...mid, ctrl.getAnalytics);
router.get('/riders',                          ...mid, ctrl.getAllRiders);
router.get('/drivers',                         ...mid, ctrl.getAllDrivers);
router.put('/drivers/:id/approve',             ...mid, ctrl.approveDriver);
router.put('/users/:id/block',                 ...mid, ctrl.blockUser);
router.delete('/users/:id',                    ...mid, ctrl.deleteUser);
router.get('/rides',                           ...mid, ctrl.getAllRides);
router.get('/complaints',                      ...mid, ctrl.getComplaints);
router.put('/complaints/:id',                  ...mid, ctrl.resolveComplaint);
router.put('/complaints/:id/block-driver',     ...mid, ctrl.blockDriverFromComplaint); // ✅ NEW
module.exports = router;
