const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage }); 


const { 
  createRestaurant,
  getMyRestaurants,
  searchRestaurants,
  getRestaurant,
  createMenu,
  getRestaurantMenus,
  addMenuItem,
  getStats,
  getManagerProfile,
  updateRestaurant,
  getMenuItem,
  updateMenuItem
} = require('../controllers/restaurantController');
const { auth, authorize } = require('../middleware/auth');

// 1. PUBLIC ROUTES - Specific paths first
router.get('/search', searchRestaurants);

router.get('/stats', auth, authorize('restaurant_manager'), getStats); 
router.get('/profile', auth, authorize('restaurant_manager'), getManagerProfile); // MUST BE ABOVE /:id
router.get('/my/restaurants', auth, authorize('restaurant_manager'), getMyRestaurants);

router.post('/upload', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    res.json({
      success: true,
      url: req.file.path // Cloudinary URL
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', getRestaurant);
router.get('/:restaurantId/menus', getRestaurantMenus);

router.post('/', auth, authorize('restaurant_manager'), createRestaurant);
router.put('/:id', auth, authorize('restaurant_manager'), updateRestaurant);
router.post('/:restaurantId/menus', auth, authorize('restaurant_manager'), createMenu);
router.post('/:restaurantId/menus/:menuId/items', auth, authorize('restaurant_manager'), addMenuItem);

router.get('/:restaurantId/menus/:menuId/items/:itemId', auth, authorize('restaurant_manager'), getMenuItem);
router.put('/:restaurantId/menus/:menuId/items/:itemId', auth, authorize('restaurant_manager'), updateMenuItem);

module.exports = router;