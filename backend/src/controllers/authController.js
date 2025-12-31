const User = require('../models/User');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');
const RestaurantManager = require('../models/RestaurantManager');

// Register user
exports.register = async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, phone_number, ...profileData } = req.body;
    
    // 1. Check if email already exists
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    
    // 2. Create the core User record
    const userData = { email, password, role, first_name, last_name, phone_number };
    const user = await User.create(userData);
    
    // 3. Create the role-specific profile (wrapped in a try-catch to prevent core crash)
    let profile;
    try {
      switch (role) {
        case 'customer':
          profile = await Customer.create(user.id, profileData);
          break;
        case 'driver':
          profile = await Driver.create(user.id, profileData);
          break;
        case 'restaurant_manager':
          profile = await RestaurantManager.create(user.id, profileData);
          break;
      }
    } catch (profileError) {
      console.error(`❌ Profile creation failed for ${role}:`, profileError.message);
      // If profile fails, we should technically handle user cleanup, 
      // but for now, we return a clear error.
      return res.status(500).json({
        success: false,
        error: `Account created, but ${role} profile failed: ${profileError.message}`
      });
    }
    
    const token = User.generateToken(user);
    
    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, role: user.role, first_name, last_name, phone_number },
        profile,
        token
      }
    });
  } catch (error) {
    console.error('❌ Global Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Get role-specific profile
    let profile;
    switch (user.role) {
      case 'customer':
        profile = await Customer.findByUserId(user.id);
        break;
      case 'driver':
        profile = await Driver.findByUserId(user.id);
        break;
      case 'restaurant_manager':
        profile = await RestaurantManager.findByUserId(user.id);
        break;
    }
    
    // Generate token
    const token = User.generateToken(user);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number
        },
        profile,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    // Get role-specific profile
    let profile;
    switch (user.role) {
      case 'customer':
        profile = await Customer.findByUserId(user.id);
        break;
      case 'driver':
        profile = await Driver.findByUserId(user.id);
        break;
      case 'restaurant_manager':
        profile = await RestaurantManager.findByUserId(user.id);
        break;
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number,
          profile_image_url: user.profile_image_url
        },
        profile
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};