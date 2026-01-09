const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Import models correctly - adjust the path based on your structure
// If your models are in src/models, you need to import them correctly
const db = require('../src/config/database');

// Helper function to get models (since we don't have direct access)
const getModel = {
    User: require('../src/models/User'),
    RestaurantManager: require('../src/models/RestaurantManager'),
    Restaurant: require('../src/models/Restaurant'),
    Menu: require('../src/models/Menu'),
    Order: require('../src/models/Order')
};

// Simple middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'restaurant_manager') {
        return next();
    }
    res.redirect('/manager/login');
};

// Login Page
router.get('/login', (req, res) => {
    if (req.session.user && req.session.user.role === 'restaurant_manager') {
        return res.redirect('/manager/dashboard');
    }
    res.render('manager/login', { 
        title: 'Manager Login',
        error: null,
        success: null
    });
});

// Login POST
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const User = getModel.User;
        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.render('manager/login', {
                title: 'Manager Login',
                error: 'Invalid email or password',
                success: null
            });
        }
        
        // Check if user is a restaurant manager
        if (user.role !== 'restaurant_manager') {
            return res.render('manager/login', {
                title: 'Manager Login',
                error: 'Access denied. Restaurant managers only.',
                success: null
            });
        }
        
        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.render('manager/login', {
                title: 'Manager Login',
                error: 'Invalid email or password',
                success: null
            });
        }
        
        // Get manager profile
        const RestaurantManager = getModel.RestaurantManager;
        const manager = await RestaurantManager.findByUserId(user.id);
        
        // Set session
        req.session.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            manager_id: manager ? manager.id : null
        };
        
        res.redirect('/manager/dashboard');
        
    } catch (error) {
        console.error('Login error:', error);
        res.render('manager/login', {
            title: 'Manager Login',
            error: 'An error occurred. Please try again.',
            success: null
        });
    }
});

// Dashboard - Protected
router.get('/dashboard', isLoggedIn, async (req, res) => {
    try {
        const RestaurantManager = getModel.RestaurantManager;
        const Restaurant = getModel.Restaurant;
        
        const manager = await RestaurantManager.findByUserId(req.session.user.id);
        
        if (!manager) {
            req.session.destroy();
            return res.redirect('/manager/login');
        }
        
        // Get restaurants for this manager
        const restaurants = await Restaurant.findByManager(manager.id);
        
        // Get some sample data for dashboard
        const recentOrders = await getRecentOrders(manager.id);
        const topItems = await getTopItems(manager.id);
        
        res.render('manager/dashboard', {
            title: 'Dashboard',
            currentPage: 'dashboard',
            manager: req.session.user,
            restaurants,
            dashboardStats: await getDashboardStats(manager.id),
            recentOrders,
            topItems
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect('/manager/login');
    }
});

// Restaurants - Protected
router.get('/restaurants', isLoggedIn, async (req, res) => {
    try {
        const RestaurantManager = getModel.RestaurantManager;
        const Restaurant = getModel.Restaurant;
        
        const manager = await RestaurantManager.findByUserId(req.session.user.id);
        
        if (!manager) {
            req.session.destroy();
            return res.redirect('/manager/login');
        }
        
        const restaurants = await Restaurant.findByManager(manager.id);
        
        res.render('manager/restaurants', {
            title: 'My Restaurants',
            currentPage: 'restaurants',
            manager: req.session.user,
            restaurants
        });
    } catch (error) {
        console.error('Restaurants error:', error);
        res.redirect('/manager/login');
    }
});

// Menus - Protected
router.get('/menus', isLoggedIn, async (req, res) => {
    try {
        const RestaurantManager = getModel.RestaurantManager;
        const Restaurant = getModel.Restaurant;
        const Menu = getModel.Menu;
        
        const manager = await RestaurantManager.findByUserId(req.session.user.id);
        
        if (!manager) {
            req.session.destroy();
            return res.redirect('/manager/login');
        }
        
        const restaurants = await Restaurant.findByManager(manager.id);
        
        let menus = [];
        let selectedRestaurant = null;
        
        if (restaurants.length > 0) {
            selectedRestaurant = restaurants[0];
            menus = await Menu.findByRestaurant(restaurants[0].id);
        }
        
        res.render('manager/menus', {
            title: 'Menu Management',
            currentPage: 'menus',
            manager: req.session.user,
            restaurants,
            menus,
            selectedRestaurant
        });
    } catch (error) {
        console.error('Menus error:', error);
        res.redirect('/manager/login');
    }
});

// Orders - Protected
router.get('/orders', isLoggedIn, async (req, res) => {
    try {
        const RestaurantManager = getModel.RestaurantManager;
        const Restaurant = getModel.Restaurant;
        
        const manager = await RestaurantManager.findByUserId(req.session.user.id);
        
        if (!manager) {
            req.session.destroy();
            return res.redirect('/manager/login');
        }
        
        const restaurants = await Restaurant.findByManager(manager.id);
        
        res.render('manager/orders', {
            title: 'Order Management',
            currentPage: 'orders',
            manager: req.session.user,
            restaurants
        });
    } catch (error) {
        console.error('Orders error:', error);
        res.redirect('/manager/login');
    }
});

// Analytics - Protected
router.get('/analytics', isLoggedIn, async (req, res) => {
    try {
        const RestaurantManager = getModel.RestaurantManager;
        const Restaurant = getModel.Restaurant;
        
        const manager = await RestaurantManager.findByUserId(req.session.user.id);
        
        if (!manager) {
            req.session.destroy();
            return res.redirect('/manager/login');
        }
        
        const restaurants = await Restaurant.findByManager(manager.id);
        
        res.render('manager/analytics', {
            title: 'Analytics',
            currentPage: 'analytics',
            manager: req.session.user,
            restaurants
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.redirect('/manager/login');
    }
});

// Settings - Protected
router.get('/settings', isLoggedIn, async (req, res) => {
    try {
        const RestaurantManager = getModel.RestaurantManager;
        const manager = await RestaurantManager.findByUserId(req.session.user.id);
        
        if (!manager) {
            req.session.destroy();
            return res.redirect('/manager/login');
        }
        
        res.render('manager/settings', {
            title: 'Settings',
            currentPage: 'settings',
            manager: req.session.user
        });
    } catch (error) {
        console.error('Settings error:', error);
        res.redirect('/manager/login');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/manager/login');
});

// Helper functions
async function getDashboardStats(managerId) {
    try {
        const Restaurant = getModel.Restaurant;
        const restaurants = await Restaurant.findByManager(managerId);
        
        if (restaurants.length === 0) {
            return {
                total_revenue: 0,
                total_orders: 0,
                avg_rating: 0,
                active_orders: 0,
                total_restaurants: 0
            };
        }
        
        // Get some basic stats
        const restaurantIds = restaurants.map(r => r.id);
        const restaurantIdsStr = restaurantIds.map(id => `'${id}'`).join(',');
        
        // Get total orders
        const ordersQuery = `
            SELECT COUNT(*) as total_orders_count 
            FROM orders 
            WHERE restaurant_id IN (${restaurantIdsStr})
            AND DATE(placed_at) = CURRENT_DATE
        `;
        
        const ordersResult = await db.query(ordersQuery);
        const totalOrders = parseInt(ordersResult.rows[0]?.total_orders_count || 0);
        
        // Get total revenue
        const revenueQuery = `
            SELECT SUM(total_amount) as total_revenue_amount 
            FROM orders 
            WHERE restaurant_id IN (${restaurantIdsStr})
            AND DATE(placed_at) = CURRENT_DATE
            AND status = 'delivered'
        `;
        
        const revenueResult = await db.query(revenueQuery);
        const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue_amount || 0);
        
        // Get active orders
        const activeQuery = `
            SELECT COUNT(*) as active_orders_count 
            FROM orders 
            WHERE restaurant_id IN (${restaurantIdsStr})
            AND status IN ('pending', 'accepted_by_driver', 'ordering_at_restaurant')
        `;
        
        const activeResult = await db.query(activeQuery);
        const activeOrders = parseInt(activeResult.rows[0]?.active_orders_count || 0);
        
        return {
            total_revenue: totalRevenue.toFixed(2),
            total_orders: totalOrders,
            avg_rating: restaurants[0].average_rating || 0,
            active_orders: activeOrders,
            total_restaurants: restaurants.length
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return {
            total_revenue: 0,
            total_orders: 0,
            avg_rating: 0,
            active_orders: 0,
            total_restaurants: 0
        };
    }
}

async function getRecentOrders(managerId) {
    try {
        const Restaurant = getModel.Restaurant;
        const restaurants = await Restaurant.findByManager(managerId);
        
        if (restaurants.length === 0) return [];
        
        const restaurantIds = restaurants.map(r => r.id);
        const restaurantIdsStr = restaurantIds.map(id => `'${id}'`).join(',');
        
        const query = `
            SELECT 
                o.*,
                r.name as restaurant_name,
                c.first_name || ' ' || c.last_name as customer_name
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.id
            JOIN customers cust ON o.customer_id = cust.id
            JOIN users c ON cust.user_id = c.id
            WHERE o.restaurant_id IN (${restaurantIdsStr})
            ORDER BY o.placed_at DESC
            LIMIT 10
        `;
        
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting recent orders:', error);
        return [];
    }
}

async function getTopItems(managerId) {
    try {
        const Restaurant = getModel.Restaurant;
        const restaurants = await Restaurant.findByManager(managerId);
        
        if (restaurants.length === 0) return [];
        
        const restaurantIds = restaurants.map(r => r.id);
        const restaurantIdsStr = restaurantIds.map(id => `'${id}'`).join(',');
        
        const query = `
            SELECT 
                mi.name,
                COUNT(oi.id) as order_count
            FROM menu_items mi
            JOIN order_items oi ON mi.id = oi.menu_item_id
            JOIN orders o ON oi.order_id = o.id
            WHERE mi.restaurant_id IN (${restaurantIdsStr})
            AND DATE(o.placed_at) = CURRENT_DATE
            GROUP BY mi.id, mi.name
            ORDER BY order_count DESC
            LIMIT 5
        `;
        
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting top items:', error);
        return [];
    }
}

module.exports = router;