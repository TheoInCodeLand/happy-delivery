const express = require('express');
const router = express.Router();
const { 
  getPopularItems,
  searchItems,
  getItemsByCategory 
} = require('../controllers/menuController');
const { auth } = require('../middleware/auth');

router.get('/popular', getPopularItems);
router.get('/search', searchItems);
router.get('/category/:category', getItemsByCategory);

module.exports = router;