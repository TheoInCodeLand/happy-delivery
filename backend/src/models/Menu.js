const db = require('../config/database');

class Menu {

  // Create menu category
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

  // Get menus by restaurant with nested items (CRITICAL FIX)
  static async findByRestaurant(restaurantId) {
    const query = `
      SELECT 
        m.id, m.name, m.description, m.is_active,
        COALESCE(
          json_agg(
            json_build_object(
              'id', mi.id,
              'name', mi.name,
              'description', mi.description,
              'price', mi.price,
              'discounted_price', mi.discounted_price,
              'image_url', mi.image_url,
              'is_available', mi.is_available,
              'is_veg', mi.is_veg, -- Ensure you ran the SQL command to add this column!
              'calories', mi.calories,
              'preparation_time_minutes', mi.preparation_time_minutes,
              'ingredients', mi.ingredients,
              'tags', mi.tags
            ) ORDER BY mi.created_at
          ) FILTER (WHERE mi.id IS NOT NULL), 
          '[]'
        ) as items
      FROM menus m
      LEFT JOIN menu_items mi ON m.id = mi.menu_id
      WHERE m.restaurant_id = $1
      GROUP BY m.id
      ORDER BY m.display_order, m.created_at
    `;
    
    const result = await db.query(query, [restaurantId]);
    return result.rows;
  }

  // Create menu item (Added image_url support)
  static async createMenuItem(menuId, restaurantId, itemData) {
    const {
      name,
      description,
      price,
      discounted_price,
      category,
      tags = [],
      is_available = true,
      is_veg = false,
      ingredients = [],
      customizations = [],
      calories = 0,
      preparation_time_minutes = 15,
      image_url
    } = itemData;
    
    const query = `
      INSERT INTO menu_items (
        menu_id, restaurant_id, name, description, price, 
        discounted_price, category, tags, is_available, 
        is_veg, ingredients, customizations, calories, 
        preparation_time_minutes, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
      is_veg,
      JSON.stringify(ingredients),
      JSON.stringify(customizations),
      calories,
      preparation_time_minutes,
      image_url
    ]);
    
    return result.rows[0];
  }

  // Get menu items by menu (Standard list)
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

  // Update menu item details
  static async updateMenuItem(itemId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    // Ensure JSON fields are stringified for PostgreSQL
    const jsonFields = ['ingredients', 'customizations', 'tags'];
    fields.forEach((field, index) => {
      if (jsonFields.includes(field) && typeof values[index] !== 'string') {
        values[index] = JSON.stringify(values[index]);
      }
    });
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `UPDATE menu_items SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    
    const result = await db.query(query, [itemId, ...values]);
    return result.rows[0];
  }

  // Update specific menu item image
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

  // Search menu items (PostGIS distance enabled)
  static async searchItems(searchTerm, lat, lng, radiusKm = 5) {
    const query = `
      SELECT 
        mi.*,
        r.name as restaurant_name,
        r.average_rating as restaurant_rating,
        ST_Distance(
          r.location::geography,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
        ) as distance_meters
      FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE (mi.name ILIKE $1 OR mi.description ILIKE $1)
        AND mi.is_available = true
        AND r.is_active = true
        AND ST_DWithin(
          r.location::geography,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
          $4 * 1000
        )
      ORDER BY distance_meters ASC
      LIMIT 50
    `;
    
    const result = await db.query(query, [`%${searchTerm}%`, lng, lat, radiusKm]);
    return result.rows;
  }

  // Get single menu item by ID (For editing)
  static async getMenuItemById(itemId) {
    const query = 'SELECT * FROM menu_items WHERE id = $1';
    const result = await db.query(query, [itemId]);
    return result.rows[0];
  }
}

module.exports = Menu;