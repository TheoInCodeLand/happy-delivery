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
  updateRestaurant
} = require('../controllers/restaurantController');
const { auth, authorize } = require('../middleware/auth');

// 1. PUBLIC ROUTES - Specific paths first
router.get('/search', searchRestaurants);

// 2. PROTECTED ROUTES - Specific paths first...
router.get('/stats', auth, authorize('restaurant_manager'), getStats); 
router.get('/profile', auth, authorize('restaurant_manager'), getManagerProfile); // MUST BE ABOVE /:id
router.get('/my/restaurants', auth, authorize('restaurant_manager'), getMyRestaurants);

// 2. THIS WILL NOW WORK
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

// 3. DYNAMIC ROUTES - MUST BE LAST
router.get('/:id', getRestaurant);
router.get('/:restaurantId/menus', getRestaurantMenus);

// 4. POST/PUT ROUTES
router.post('/', auth, authorize('restaurant_manager'), createRestaurant);
router.put('/:id', auth, authorize('restaurant_manager'), updateRestaurant);
router.post('/:restaurantId/menus', auth, authorize('restaurant_manager'), createMenu);
router.post('/:restaurantId/menus/:menuId/items', auth, authorize('restaurant_manager'), addMenuItem);

module.exports = router;