const express = require('express');
const router = express.Router();
const {
  updateLocation,
  updateStatus,
  getAvailableOrders,
  getEarnings,
  getCurrentLocation
} = require('../controllers/driverController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth, authorize('driver'));

router.put('/location', updateLocation);
router.put('/status', updateStatus);
router.get('/available-orders', getAvailableOrders);
router.get('/earnings', getEarnings);
router.get('/location', getCurrentLocation);

module.exports = router;