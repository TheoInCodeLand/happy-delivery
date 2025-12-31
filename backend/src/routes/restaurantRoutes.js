const express = require('express');
const router = express.Router();
const { 
  createRestaurant,
  getMyRestaurants,
  searchRestaurants,
  getRestaurant,
  createMenu,
  getRestaurantMenus,
  addMenuItem
} = require('../controllers/restaurantController');
const { auth, authorize } = require('../middleware/auth');

// Public routes
router.get('/search', searchRestaurants);
router.get('/:id', getRestaurant);
router.get('/:restaurantId/menus', getRestaurantMenus);

// Protected routes
router.post('/', auth, authorize('restaurant_manager'), createRestaurant);
router.get('/my/restaurants', auth, authorize('restaurant_manager'), getMyRestaurants);
router.post('/:restaurantId/menus', auth, authorize('restaurant_manager'), createMenu);
router.post('/:restaurantId/menus/:menuId/items', auth, authorize('restaurant_manager'), addMenuItem);

module.exports = router;