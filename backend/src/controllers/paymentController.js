const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// Process payment for order
exports.processPayment = async (req, res) => {
  try {
    const { order_id, payment_method, payment_details } = req.body;
    
    // Get customer
    const customer = await Customer.findByUserId(req.user.id);
    
    // Get order
    const order = await Order.findById(order_id, req.user.id, req.user.role);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if order is in correct status for payment
    if (order.status !== 'accepted_by_driver') {
      return res.status(400).json({
        success: false,
        error: 'Payment can only be made after driver accepts the order'
      });
    }
    
    // Check if payment already exists
    const existingPayment = await Payment.findByOrderId(order_id);
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Payment already processed for this order'
      });
    }
    
    // Process payment (this is a mock - integrate with actual payment gateway)
    const paymentData = {
      order_id,
      customer_id: customer.id,
      amount: order.total_amount,
      payment_method,
      gateway_transaction_id: `txn_${Date.now()}`,
      gateway_response: {
        status: 'success',
        transaction_id: `txn_${Date.now()}`,
        amount: order.total_amount,
        currency: 'USD'
      }
    };
    
    const payment = await Payment.create(paymentData);
    
    // Update payment status to completed
    await Payment.updateStatus(payment.id, 'completed');
    
    // Update order payment status
    // Note: You might want to add this functionality to the Order model
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get payment details
exports.getPaymentDetails = async (req, res) => {
  try {
    const { order_id } = req.params;
    
    const payment = await Payment.findByOrderId(order_id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    // Check if user has permission to view this payment
    if (req.user.role === 'customer') {
      const customer = await Customer.findByUserId(req.user.id);
      if (payment.customer_id !== customer.id) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this payment'
        });
      }
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get my payments (for customer)
exports.getMyPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const customer = await Customer.findByUserId(req.user.id);
    const payments = await Payment.getCustomerPayments(
      customer.id,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};