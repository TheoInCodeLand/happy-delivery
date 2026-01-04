const db = require('../config/database');

class Restaurant {
  // Create restaurant
  static async create(managerId, data) {
    const {
      name, description, cuisine_type, address,
      latitude, longitude, phone_number,
      opening_hours, preparation_time, 
      logo_url, cover_url 
    } = data;

    const cuisineArray = typeof cuisine_type === 'string' 
    ? cuisine_type.split(',').map(item => item.trim()) 
    : cuisine_type;

    const query = `
      INSERT INTO restaurants (
        manager_id, name, description, cuisine_type, 
        address, location, phone_number, 
        opening_hours, preparation_time_minutes, 
        logo_url, cover_image_url, total_ratings, is_active
      )
      VALUES (
        $1, $2, $3, $4, 
        $5, ST_SetSRID(ST_MakePoint($7, $6), 4326), -- FIX: Use ST_SetSRID for Geometry
        $8, $9, $10, $11, $12,
        5.0, true
      )
      RETURNING *
    `;

    const values = [
      managerId, name, description, cuisine_type,
      address, latitude, longitude, phone_number,
      JSON.stringify({ display: opening_hours }), preparation_time, 
      logo_url || null, cover_url || null
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Add restaurant to manager's lists
  static async addRestaurantToManager(managerId, restaurantId) {
    const query = `
      UPDATE restaurant_managers 
      SET restaurant_ids = COALESCE(restaurant_ids, '{}'::uuid[]) || $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await db.query(query, [managerId, restaurantId]);
  }

  // Get restaurant by ID
  static async findById(id) {
    const query = `
      SELECT r.*, 
             u.first_name as manager_first_name,
             u.last_name as manager_last_name,
             u.email as manager_email
      FROM restaurants r
      JOIN restaurant_managers rm ON r.manager_id = rm.id
      JOIN users u ON rm.user_id = u.id
      WHERE r.id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Get restaurants by manager
  static async findByManager(managerId) {
    const query = 'SELECT * FROM restaurants WHERE manager_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [managerId]);
    return result.rows;
  }

  // Search restaurants by location and filters

  static async search(lat, lng, filters = {}) {
  try {
    const { cuisine, minRating, maxDistance = 90 } = filters;
    
    // Standardize radius to meters (90km = 90000 meters)
    const radiusMeters = maxDistance * 1000; 
    
    let query = `
      SELECT 
        r.id, r.name, r.description, r.cuisine_type, r.address, 
        r.total_ratings, r.logo_url, r.cover_image_url, r.opening_hours, r.preparation_time_minutes,
        ST_X(r.location::geometry) as longitude, -- Extract as float
        ST_Y(r.location::geometry) as latitude,  -- Extract as float
        ST_Distance(
          r.location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance_meters
      FROM restaurants r
      WHERE r.is_active = true
      AND ST_DWithin(
        r.location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
    `;

    const values = [lng, lat, radiusMeters]; // Always [Longitude, Latitude] for PostGIS

    // Optional: Add cuisine filter if provided
    if (cuisine) {
      query += ` AND $4 = ANY(r.cuisine_type)`;
      values.push(cuisine);
    }

    query += ` ORDER BY distance_meters ASC`;

    const result = await db.query(query, values);
    return result.rows;

  } catch (error) {
    console.error('❌ Error in Restaurant.search:', error.message);
    throw error;
  }
}
  // Update restaurant details
  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    // Handle location specially if present
    const locationIndex = fields.findIndex(field => field === 'location');
    if (locationIndex !== -1) {
      const [lng, lat] = updateData.location;
      fields[locationIndex] = `POINT($${fields.length + 1}, $${fields.length + 2})`;
      values.splice(locationIndex, 1, lng, lat);
    }
    
    const setClause = fields.map((field, index) => {
      if (field.startsWith('POINT')) return `location = ${field}`;
      return `${field} = $${index + 2}`;
    }).join(', ');
    
    const query = `
      UPDATE restaurants 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }

  // Get restaurant statistics
  static async getStatistics(restaurantId, startDate, endDate) {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.restaurant_rating) as average_rating,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        DATE(o.placed_at) as order_date,
        EXTRACT(HOUR FROM o.placed_at) as hour_of_day
      FROM orders o
      WHERE o.restaurant_id = $1
        AND o.placed_at BETWEEN $2 AND $3
        AND o.status = 'delivered'
      GROUP BY DATE(o.placed_at), EXTRACT(HOUR FROM o.placed_at)
      ORDER BY order_date DESC, hour_of_day
    `;
    
    const result = await db.query(query, [restaurantId, startDate, endDate]);
    return result.rows;
  }
}

module.exports = Restaurant;