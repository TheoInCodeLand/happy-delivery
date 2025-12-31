const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');

// Create restaurant
exports.createRestaurant = async (req, res) => {
  try {
    const managerProfile = await RestaurantManager.findByUserId(req.user.id);
    const restaurant = await Restaurant.create(managerProfile.id, req.body);
    
    res.status(201).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get restaurants by manager
exports.getMyRestaurants = async (req, res) => {
  try {
    const managerProfile = await RestaurantManager.findByUserId(req.user.id);
    const restaurants = await Restaurant.findByManager(managerProfile.id);
    
    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Search restaurants
exports.searchRestaurants = async (req, res) => {
  try {
    const { lat, lng, cuisine, minRating, maxDistance, isOpen } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const filters = {
      cuisine: cuisine ? cuisine.split(',') : null,
      minRating: minRating ? parseFloat(minRating) : null,
      maxDistance: maxDistance ? parseFloat(maxDistance) : 10,
      isOpen: isOpen === 'true'
    };
    
    const restaurants = await Restaurant.search(
      parseFloat(lat),
      parseFloat(lng),
      filters
    );
    
    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    console.error('Search restaurants error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get restaurant details
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create menu
exports.createMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Verify restaurant ownership
    const managerProfile = await RestaurantManager.findByUserId(req.user.id);
    const restaurants = await Restaurant.findByManager(managerProfile.id);
    
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this restaurant'
      });
    }
    
    const menu = await Menu.create(restaurantId, req.body);
    
    res.status(201).json({
      success: true,
      data: menu
    });
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get restaurant menus
exports.getRestaurantMenus = async (req, res) => {
  try {
    const menus = await Menu.findByRestaurant(req.params.restaurantId);
    
    res.json({
      success: true,
      data: menus
    });
  } catch (error) {
    console.error('Get menus error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add menu item
exports.addMenuItem = async (req, res) => {
  try {
    const { restaurantId, menuId } = req.params;
    
    // Verify restaurant ownership
    const managerProfile = await RestaurantManager.findByUserId(req.user.id);
    const restaurants = await Restaurant.findByManager(managerProfile.id);
    
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this restaurant'
      });
    }
    
    const menuItem = await Menu.createMenuItem(menuId, restaurantId, req.body);
    
    res.status(201).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};