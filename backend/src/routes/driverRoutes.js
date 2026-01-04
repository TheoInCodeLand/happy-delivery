const express = require('express');
const router = express.Router();
const {
  updateLocation,
  updateStatus,
  getAvailableOrders,
  getEarnings,
  getCurrentLocation,
  getStats,
  getDriverOrders,
  getDriverProfile,
  updateVehicleInfo
} = require('../controllers/driverController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth, authorize('driver'));

//SELECT METHODS
router.get('/stats', getStats); 
router.get('/orders', getDriverOrders);
router.get('/profile', getDriverProfile);
router.get('/available-orders', getAvailableOrders);
router.get('/earnings', getEarnings);
router.get('/location', getCurrentLocation);

//UPDATE METHODS
router.put('/location', updateLocation);
router.put('/status', updateStatus);
router.put('/vehicle', updateVehicleInfo);


module.exports = router;