const db = require('../config/database');

class Driver {
  // Create driver profile
  static async create(userId, driverData) {
    const { 
      driver_license_number, 
      license_expiry_date, 
      vehicle_type, 
      vehicle_registration,
      vehicle_color,
      vehicle_model 
    } = driverData;
    
    const query = `
      INSERT INTO drivers (
        user_id, 
        driver_license_number, 
        license_expiry_date, 
        vehicle_type, 
        vehicle_registration,
        vehicle_color,
        vehicle_model,
        current_status,
        is_available,
        service_radius_km
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'offline', true, 10)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userId, 
      driver_license_number, 
      license_expiry_date, 
      vehicle_type, 
      vehicle_registration,
      vehicle_color,
      vehicle_model
    ]);
    
    return result.rows[0];
  }

  // Get driver by user ID
  static async findByUserId(userId) {
    const query = `
      SELECT d.*, u.email, u.phone_number, u.first_name, u.last_name
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  // Update driver location
  static async updateLocation(driverId, lat, lng) {
    const query = `
      UPDATE drivers 
      SET 
        current_location = POINT($2, $3),
        last_location_update = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING current_location
    `;
    
    const result = await db.query(query, [driverId, lat, lng]);
    return result.rows[0];
  }

  // Update driver status
  static async updateStatus(driverId, status) {
    const validStatuses = ['available', 'busy', 'offline', 'on_delivery'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }
    
    const query = `
      UPDATE drivers 
      SET 
        current_status = $2,
        is_available = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const isAvailable = status === 'available';
    const result = await db.query(query, [driverId, status, isAvailable]);
    return result.rows[0];
  }

  // Get available drivers near location
  static async findAvailableDrivers(lat, lng, radiusKm = 10) {
    const query = `
      SELECT 
        d.*,
        u.first_name,
        u.last_name,
        u.phone_number,
        ST_Distance(
          d.current_location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance_meters
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.is_available = true
        AND d.current_status = 'available'
        AND ST_DWithin(
          d.current_location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3 * 1000
        )
      ORDER BY distance_meters
      LIMIT 20
    `;
    
    const result = await db.query(query, [lng, lat, radiusKm]);
    return result.rows;
  }

  // Get driver earnings
  static async getEarnings(driverId, startDate, endDate) {
    const query = `
      SELECT 
        SUM(e.net_amount) as total_earnings,
        COUNT(e.id) as total_deliveries,
        DATE(e.created_at) as delivery_date
      FROM earnings e
      WHERE e.driver_id = $1
        AND e.created_at BETWEEN $2 AND $3
      GROUP BY DATE(e.created_at)
      ORDER BY delivery_date DESC
    `;
    
    const result = await db.query(query, [driverId, startDate, endDate]);
    return result.rows;
  }

  // Get available orders for driver
  static async getAvailableOrders(driverId) {
    const query = `
      SELECT 
        o.*,
        r.name as restaurant_name,
        r.address as restaurant_address,
        r.location as restaurant_location,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        ST_Distance(
          d.current_location::geography,
          r.location::geography
        ) as distance_to_restaurant,
        EXTRACT(EPOCH FROM (q.expires_at - NOW())) as time_left_seconds
      FROM driver_order_queue q
      JOIN orders o ON q.order_id = o.id
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN customers cust ON o.customer_id = cust.id
      JOIN users c ON cust.user_id = c.id
      JOIN drivers d ON d.id = $1
      WHERE q.is_active = true
        AND q.expires_at > NOW()
        AND (q.seen_by_driver_ids IS NULL OR NOT (q.seen_by_driver_ids @> ARRAY[$1]::uuid[]))
        AND (q.declined_by_driver_ids IS NULL OR NOT (q.declined_by_driver_ids @> ARRAY[$1]::uuid[]))
      ORDER BY q.created_at ASC
      LIMIT 10
    `;
    
    const result = await db.query(query, [driverId]);
    return result.rows;
  }
}

module.exports = Driver;