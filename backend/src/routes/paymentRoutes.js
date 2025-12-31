const express = require('express');
const router = express.Router();
const {
  processPayment,
  getPaymentDetails,
  getMyPayments
} = require('../controllers/paymentController');
const { auth, authorize } = require('../middleware/auth');

// Customer routes
router.post('/process', auth, authorize('customer'), processPayment);
router.get('/my', auth, authorize('customer'), getMyPayments);
router.get('/:order_id', auth, getPaymentDetails);

module.exports = router;