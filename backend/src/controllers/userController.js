const User = require('../models/User');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');
const RestaurantManager = require('../models/RestaurantManager');

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone_number, profile_image_url } = req.body;
    
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone_number) updateData.phone_number = phone_number;
    if (profile_image_url) updateData.profile_image_url = profile_image_url;
    
    const updatedUser = await User.update(req.user.id, updateData);
    
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update role-specific profile
exports.updateRoleProfile = async (req, res) => {
  try {
    const user = req.user;
    let updatedProfile;
    
    switch (user.role) {
      case 'customer':
        const customer = await Customer.findByUserId(user.id);
        updatedProfile = await Customer.updatePreferences(customer.id, req.body);
        break;
        
      case 'driver':
        const driver = await Driver.findByUserId(user.id);
        // Update driver-specific fields
        const driverUpdateData = {};
        if (req.body.vehicle_type) driverUpdateData.vehicle_type = req.body.vehicle_type;
        if (req.body.vehicle_color) driverUpdateData.vehicle_color = req.body.vehicle_color;
        if (req.body.vehicle_model) driverUpdateData.vehicle_model = req.body.vehicle_model;
        if (req.body.service_radius_km) driverUpdateData.service_radius_km = req.body.service_radius_km;
        
        // You'll need to add an update method to the Driver model
        // For now, we'll just return the current driver
        updatedProfile = driver;
        break;
        
      case 'restaurant_manager':
        const manager = await RestaurantManager.findByUserId(user.id);
        // Add update method to RestaurantManager if needed
        updatedProfile = manager;
        break;
    }
    
    res.json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    console.error('Update role profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};