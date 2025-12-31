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