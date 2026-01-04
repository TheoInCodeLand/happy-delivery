const Driver = require('../models/Driver');
const Order = require('../models/Order');

// Update driver location
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const driver = await Driver.findByUserId(req.user.id);
    const updatedLocation = await Driver.updateLocation(driver.id, lat, lng);
    
    res.json({
      success: true,
      data: updatedLocation
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update driver status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const driver = await Driver.findByUserId(req.user.id);
    const updatedDriver = await Driver.updateStatus(driver.id, status);
    
    res.json({
      success: true,
      data: updatedDriver
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add this function to your existing controller
exports.getStats = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver profile not found' });
    }

    // Logic for dashboard stats
    const stats = {
      totalEarnings: parseFloat(driver.total_earnings || 0),
      todayEarnings: 0, // You can calculate this from earnings table
      totalDeliveries: parseInt(driver.total_deliveries || 0),
      averageRating: parseFloat(driver.average_rating || 5.0),
      isAvailable: driver.is_available
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get available orders for driver
exports.getAvailableOrders = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    const orders = await Driver.getAvailableOrders(driver.id);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add this to your existing driverController.js
exports.getDriverOrders = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    // Call a new model method to get history
    const orders = await Driver.getOrderHistory(driver.id);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('❌ Get driver orders error:', error.message);
    res.status(500).json({ success: false, error: 'Server error fetching orders' });
  }
};

// Add to driverController.js
exports.updateVehicleInfo = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    const updatedDriver = await Driver.updateVehicleInfo(driver.id, req.body);
    
    res.json({
      success: true,
      data: updatedDriver
    });
  } catch (error) {
    console.error('Update vehicle info error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add this to your existing driverController.js
exports.getDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver profile not found' });
    }

    // Convert potential string decimals to actual numbers
    const formattedDriver = {
      ...driver,
      average_rating: parseFloat(driver.average_rating || 0),
      total_earnings: parseFloat(driver.total_earnings || 0)
    };

    res.json({
      success: true,
      data: formattedDriver
    });
  } catch (error) {
    console.error('❌ Get driver profile error:', error.message);
    res.status(500).json({ success: false, error: 'Server error fetching profile' });
  }
};

// Get driver earnings
exports.getEarnings = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const driver = await Driver.findByUserId(req.user.id);
    const earnings = await Driver.getEarnings(
      driver.id,
      start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      end_date || new Date().toISOString()
    );
    
    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get current location
exports.getCurrentLocation = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    res.json({
      success: true,
      data: {
        location: driver.current_location,
        last_update: driver.last_location_update
      }
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};