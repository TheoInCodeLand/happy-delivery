const db = require('../config/database');

class Customer {
  // Create customer profile
  static async create(userId, customerData = {}) {
    const query = `
      INSERT INTO customers (user_id, delivery_addresses)
      VALUES ($1, $2)
      RETURNING *
    `;
    // FIX: Wrap the delivery_addresses in JSON.stringify
    const safeAddresses = JSON.stringify(customerData.delivery_addresses || []);
    
    const result = await db.query(query, [userId, safeAddresses]);
    return result.rows[0];
  }

  // Get customer by user ID
  static async findByUserId(userId) {
    const query = `
      SELECT c.*, u.email, u.phone_number, u.first_name, u.last_name
      FROM customers c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  // Add delivery address
  static async addDeliveryAddress(customerId, address) {
    const query = `
      UPDATE customers 
      SET delivery_addresses = delivery_addresses || $2::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING delivery_addresses
    `;
    
    const result = await db.query(query, [customerId, JSON.stringify([address])]);
    return result.rows[0];
  }

  // Update customer preferences
  static async updatePreferences(customerId, preferences) {
    const { dietary_preferences, default_payment_method } = preferences;
    const query = `
      UPDATE customers 
      SET 
        dietary_preferences = COALESCE($2, dietary_preferences),
        default_payment_method = COALESCE($3, default_payment_method),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [customerId, dietary_preferences, default_payment_method]);
    return result.rows[0];
  }

  // Get customer order history
  static async getOrderHistory(customerId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT o.*, r.name as restaurant_name, d.first_name as driver_first_name, d.last_name as driver_last_name
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN drivers dr ON o.driver_id = dr.id
      LEFT JOIN users d ON dr.user_id = d.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = 'SELECT COUNT(*) FROM orders WHERE customer_id = $1';
    
    const [ordersResult, countResult] = await Promise.all([
      db.query(query, [customerId, limit, offset]),
      db.query(countQuery, [customerId])
    ]);
    
    return {
      orders: ordersResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
  }
}

module.exports = Customer;