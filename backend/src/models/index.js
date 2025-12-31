// Export all models from a single file
const User = require('./User');
const Customer = require('./Customer');
const Driver = require('./Driver');
const RestaurantManager = require('./RestaurantManager');
const Restaurant = require('./Restaurant');
const Menu = require('./Menu');
const Order = require('./Order');
const Payment = require('./Payment');

module.exports = {
  User,
  Customer,
  Driver,
  RestaurantManager,
  Restaurant,
  Menu,
  Order,
  Payment
};