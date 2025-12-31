const db = require('../config/database');

class RestaurantManager {
  // Create restaurant manager profile
  static async create(userId, managerData = {}) {
    const query = `
      INSERT INTO restaurant_managers (user_id, restaurant_ids)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, managerData.restaurant_ids || []]);
    return result.rows[0];
  }

  // Get restaurant manager by user ID
  static async findByUserId(userId) {
    const query = `
      SELECT rm.*, u.email, u.phone_number, u.first_name, u.last_name
      FROM restaurant_managers rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  // Get restaurants managed by this manager
  static async getManagedRestaurants(managerId) {
    const query = `
      SELECT r.*
      FROM restaurants r
      WHERE r.manager_id = $1
      ORDER BY r.created_at DESC
    `;
    
    const result = await db.query(query, [managerId]);
    return result.rows;
  }

  // Update restaurant manager
  static async update(managerId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `
      UPDATE restaurant_managers 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [managerId, ...values]);
    return result.rows[0];
  }

  // Add restaurant to manager's list
  static async addRestaurant(managerId, restaurantId) {
    const query = `
      UPDATE restaurant_managers 
      SET 
        restaurant_ids = array_append(COALESCE(restaurant_ids, '{}'::uuid[]), $2),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING restaurant_ids
    `;
    
    const result = await db.query(query, [managerId, restaurantId]);
    return result.rows[0];
  }
}

module.exports = RestaurantManager;