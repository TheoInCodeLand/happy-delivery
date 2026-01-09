const Menu = require('../models/Menu');

exports.getPopularItems = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // Get popular items (you might want to implement popularity logic)
    const items = await Menu.searchItems('', parseFloat(lat), parseFloat(lng), {
      minRating: 4.0,
      limit: 20
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get popular items error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.searchItems = async (req, res) => {
  try {
    const { q, lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const items = await Menu.searchItems(
      q || '',
      parseFloat(lat),
      parseFloat(lng),
      { radiusKm: radius }
    );

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // You'll need to add a method to Menu model to get by category
    const items = await Menu.getItemsByCategory(
      category,
      parseFloat(lat),
      parseFloat(lng),
      { radiusKm: radius }
    );

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get items by category error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
