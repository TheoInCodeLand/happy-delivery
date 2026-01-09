const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');

// Create order
exports.createOrder = async (req, res) => {
  try {
    const customer = await Customer.findByUserId(req.user.id);
    const newOrder = await Order.create(customer.id, req.body);
    const io = req.app.get('io');
    // Notify drivers about the new order
    if (io) {
      console.log("🔔 Emitting new order to drivers...");
      io.to('drivers').emit('new_order', {
        orderId: newOrder.id,
        restaurantName: newOrder.restaurant_name,
        total: newOrder.total_amount
      });
    }
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get order details
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    const items = await Order.getOrderItems(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get my orders
exports.getMyOrders = async (req, res) => {
  try {
    const { status, start_date, end_date, page, limit } = req.query;
    
    const filters = {
      status,
      start_date,
      end_date,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    };
    
    const orders = await Order.getOrdersByUser(
      req.user.id,
      req.user.role,
      filters
    );
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Accept order (driver)
exports.acceptOrder = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    const order = await Order.acceptOrder(
      req.params.id,
      driver.id
    );
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Decline order (driver)
exports.declineOrder = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    const result = await Order.declineOrder(
      req.params.id,
      driver.id
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Decline order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    let driver = null;
    if (req.user.role === 'driver') {
      driver = await Driver.findByUserId(req.user.id);
    }
    
    const order = await Order.updateStatus(
      req.params.id,
      status,
      driver ? driver.id : null
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};