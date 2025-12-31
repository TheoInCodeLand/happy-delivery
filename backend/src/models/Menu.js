const db = require('../config/database');

class Menu {
  // Create menu
  static async create(restaurantId, menuData) {
    const { name, description, is_active = true, display_order = 0 } = menuData;
    
    const query = `
      INSERT INTO menus (restaurant_id, name, description, is_active, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [restaurantId, name, description, is_active, display_order]);
    return result.rows[0];
  }

  // Get menus by restaurant
  static async findByRestaurant(restaurantId) {
    const query = `
      SELECT m.*, 
             COUNT(mi.id) as item_count,
             SUM(CASE WHEN mi.is_available = true THEN 1 ELSE 0 END) as available_items
      FROM menus m
      LEFT JOIN menu_items mi ON m.id = mi.menu_id
      WHERE m.restaurant_id = $1
      GROUP BY m.id
      ORDER BY m.display_order, m.created_at
    `;
    
    const result = await db.query(query, [restaurantId]);
    return result.rows;
  }

  // Create menu item
  static async createMenuItem(menuId, restaurantId, itemData) {
    const {
      name,
      description,
      price,
      discounted_price,
      category,
      tags = [],
      is_available = true,
      ingredients = [],
      customizations = [],
      calories,
      preparation_time_minutes
    } = itemData;
    
    const query = `
      INSERT INTO menu_items (
        menu_id,
        restaurant_id,
        name,
        description,
        price,
        discounted_price,
        category,
        tags,
        is_available,
        ingredients,
        customizations,
        calories,
        preparation_time_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      menuId,
      restaurantId,
      name,
      description,
      price,
      discounted_price,
      category,
      tags,
      is_available,
      JSON.stringify(ingredients),
      JSON.stringify(customizations),
      calories,
      preparation_time_minutes
    ]);
    
    return result.rows[0];
  }

  // Get menu items by menu
  static async getMenuItems(menuId, filters = {}) {
    const { category, min_price, max_price, tags, is_available = true } = filters;
    
    let query = `
      SELECT * FROM menu_items 
      WHERE menu_id = $1 
        AND is_available = $2
    `;
    
    const params = [menuId, is_available];
    let paramIndex = 3;
    
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (min_price) {
      query += ` AND price >= $${paramIndex}`;
      params.push(min_price);
      paramIndex++;
    }
    
    if (max_price) {
      query += ` AND price <= $${paramIndex}`;
      params.push(max_price);
      paramIndex++;
    }
    
    if (tags && tags.length > 0) {
      query += ` AND tags && $${paramIndex}`;
      params.push(tags);
      paramIndex++;
    }
    
    query += ` ORDER BY 
      CASE WHEN is_popular = true THEN 0 ELSE 1 END,
      category,
      name`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Update menu item
  static async updateMenuItem(itemId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    // Handle JSON fields
    const jsonFields = ['ingredients', 'customizations', 'tags'];
    fields.forEach((field, index) => {
      if (jsonFields.includes(field) && typeof values[index] !== 'string') {
        values[index] = JSON.stringify(values[index]);
      }
    });
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `UPDATE menu_items SET ${setClause} WHERE id = $1 RETURNING *`;
    
    const result = await db.query(query, [itemId, ...values]);
    return result.rows[0];
  }

  // Update menu item image
  static async updateMenuItemImage(itemId, imageUrl) {
    const query = `
      UPDATE menu_items 
      SET image_url = $2 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await db.query(query, [itemId, imageUrl]);
    return result.rows[0];
  }

  // Search menu items across restaurants
  static async searchItems(searchTerm, lat, lng, radiusKm = 5) {
    const query = `
      SELECT 
        mi.*,
        r.name as restaurant_name,
        r.address as restaurant_address,
        r.average_rating as restaurant_rating,
        ST_Distance(
          r.location::geography,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
        ) as distance_meters
      FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE (
        mi.name ILIKE $1 
        OR mi.description ILIKE $1 
        OR mi.tags::text ILIKE $1
      )
        AND mi.is_available = true
        AND r.is_active = true
        AND r.is_accepting_orders = true
        AND ST_DWithin(
          r.location::geography,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
          $4 * 1000
        )
      ORDER BY distance_meters, restaurant_rating DESC
      LIMIT 50
    `;
    
    const result = await db.query(query, [`%${searchTerm}%`, lng, lat, radiusKm]);
    return result.rows;
  }
}

module.exports = Menu;