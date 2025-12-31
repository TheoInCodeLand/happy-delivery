const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrder,
  getMyOrders,
  acceptOrder,
  declineOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { auth, authorize } = require('../middleware/auth');

// Customer routes
router.post('/', auth, authorize('customer'), createOrder);
router.get('/my', auth, authorize('customer'), getMyOrders);

// Driver routes
router.post('/:id/accept', auth, authorize('driver'), acceptOrder);
router.post('/:id/decline', auth, authorize('driver'), declineOrder);
router.patch('/:id/status', auth, authorize('driver'), updateOrderStatus);

// Shared routes
router.get('/:id', auth, getOrder);

module.exports = router;