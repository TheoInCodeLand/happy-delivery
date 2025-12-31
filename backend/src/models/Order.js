const db = require('../config/database');
const { emitOrderUpdate } = require('../socket');

class Order {
  // Create new order
  static async create(customerId, orderData) {
    const {
      restaurant_id,
      items,
      special_instructions,
      delivery_instructions,
      delivery_address,
      subtotal,
      delivery_fee,
      tax_amount,
      tip_amount = 0
    } = orderData;
    
    // Calculate total
    const total_amount = subtotal + delivery_fee + tax_amount + tip_amount;
    
    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create order
      const orderQuery = `
        INSERT INTO orders (
          customer_id,
          restaurant_id,
          special_instructions,
          delivery_instructions,
          delivery_address,
          subtotal,
          delivery_fee,
          tax_amount,
          tip_amount,
          total_amount,
          driver_acceptance_deadline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '150 seconds')
        RETURNING *
      `;
      
      const orderResult = await client.query(orderQuery, [
        customerId,
        restaurant_id,
        special_instructions,
        delivery_instructions,
        JSON.stringify(delivery_address),
        subtotal,
        delivery_fee,
        tax_amount,
        tip_amount,
        total_amount
      ]);
      
      const order = orderResult.rows[0];
      
      // Add order items
      for (const item of items) {
        const itemQuery = `
          INSERT INTO order_items (
            order_id,
            menu_item_id,
            quantity,
            unit_price,
            special_instructions,
            selected_options,
            allergen_notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await client.query(itemQuery, [
          order.id,
          item.menu_item_id,
          item.quantity,
          item.unit_price,
          item.special_instructions,
          JSON.stringify(item.selected_options || {}),
          item.allergen_notes
        ]);
      }
      
      // Add to driver queue
      const queueQuery = `
        INSERT INTO driver_order_queue (order_id, expires_at)
        VALUES ($1, NOW() + INTERVAL '150 seconds')
        RETURNING *
      `;
      
      await client.query(queueQuery, [order.id]);
      
      // Get available drivers near restaurant
      const restaurantQuery = 'SELECT location FROM restaurants WHERE id = $1';
      const restaurantResult = await client.query(restaurantQuery, [restaurant_id]);
      const restaurantLocation = restaurantResult.rows[0].location;
      
      const [lng, lat] = restaurantLocation.replace(/[()]/g, '').split(',').map(Number);
      
      const driversQuery = `
        SELECT d.id
        FROM drivers d
        WHERE d.is_available = true
          AND d.current_status = 'available'
          AND ST_DWithin(
            d.current_location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            10000
          )
      `;
      
      const driversResult = await client.query(driversQuery, [lng, lat]);
      const driverIds = driversResult.rows.map(row => row.id);
      
      // Update queue with available drivers
      if (driverIds.length > 0) {
        await client.query(
          'UPDATE driver_order_queue SET available_driver_ids = $1 WHERE order_id = $2',
          [driverIds, order.id]
        );
      }
      
      await client.query('COMMIT');
      
      // Emit real-time update
      emitOrderUpdate(order.id, {
        type: 'order_created',
        order,
        available_drivers: driverIds.length
      });
      
      return order;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get order by ID
  static async findById(orderId, userId = null, userRole = null) {
    let query = `
      SELECT 
        o.*,
        r.name as restaurant_name,
        r.address as restaurant_address,
        r.phone_number as restaurant_phone,
        r.logo_url as restaurant_logo,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone_number as customer_phone,
        u.first_name as driver_first_name,
        u.last_name as driver_last_name,
        u.phone_number as driver_phone,
        d.vehicle_type as driver_vehicle,
        d.vehicle_color as driver_vehicle_color,
        d.current_location as driver_location
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN customers cust ON o.customer_id = cust.id
      LEFT JOIN users c ON cust.user_id = c.id
      LEFT JOIN drivers dr ON o.driver_id = dr.id
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN drivers d ON o.driver_id = d.id
      WHERE o.id = $1
    `;
    
    const params = [orderId];
    
    // Add role-based access control
    if (userRole === 'customer') {
      query += ` AND o.customer_id = (SELECT id FROM customers WHERE user_id = $2)`;
      params.push(userId);
    } else if (userRole === 'driver') {
      query += ` AND o.driver_id = (SELECT id FROM drivers WHERE user_id = $2)`;
      params.push(userId);
    } else if (userRole === 'restaurant_manager') {
      query += ` AND o.restaurant_id IN (SELECT id FROM restaurants WHERE manager_id = (SELECT id FROM restaurant_managers WHERE user_id = $2))`;
      params.push(userId);
    }
    
    const result = await db.query(query, params);
    return result.rows[0];
  }

  // Get order items
  static async getOrderItems(orderId) {
    const query = `
      SELECT 
        oi.*,
        mi.name as item_name,
        mi.description as item_description,
        mi.image_url as item_image
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `;
    
    const result = await db.query(query, [orderId]);
    return result.rows;
  }

  // Driver accepts order
  static async acceptOrder(orderId, driverId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if order is still available
      const checkQuery = `
        SELECT o.*, q.expires_at
        FROM orders o
        JOIN driver_order_queue q ON o.id = q.order_id
        WHERE o.id = $1 
          AND o.status = 'pending'
          AND q.is_active = true
          AND q.expires_at > NOW()
      `;
      
      const checkResult = await client.query(checkQuery, [orderId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Order no longer available');
      }
      
      // Update order with driver
      const updateQuery = `
        UPDATE orders 
        SET 
          driver_id = $2,
          status = 'accepted_by_driver',
          accepted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [orderId, driverId]);
      const order = updateResult.rows[0];
      
      // Update driver status
      await client.query(
        `UPDATE drivers SET current_status = 'busy', is_available = false WHERE id = $1`,
        [driverId]
      );
      
      // Mark queue as completed
      await client.query(
        `UPDATE driver_order_queue SET is_active = false, completed_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
        [orderId]
      );
      
      await client.query('COMMIT');
      
      // Emit real-time updates
      emitOrderUpdate(order.id, {
        type: 'order_accepted',
        order,
        driver_id: driverId
      });
      
      // Create notification for customer
      await this.createNotification(
        order.customer_id,
        'customer',
        'Driver Accepted',
        'A driver has accepted your order!',
        'order_accepted',
        { order_id: orderId, driver_id: driverId }
      );
      
      return order;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Driver declines order
  static async declineOrder(orderId, driverId) {
    const query = `
      UPDATE driver_order_queue 
      SET declined_by_driver_ids = COALESCE(declined_by_driver_ids, '{}'::uuid[]) || $2
      WHERE order_id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [orderId, driverId]);
    return result.rows[0];
  }

  // Update order status
  static async updateStatus(orderId, status, driverId = null) {
    const validStatuses = [
      'ordering_at_restaurant',
      'order_ready',
      'picked_up',
      'on_the_way',
      'arrived',
      'delivered',
      'cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }
    
    const timestampColumns = {
      'ordering_at_restaurant': 'restaurant_notified_at',
      'order_ready': 'ready_for_pickup_at',
      'picked_up': 'picked_up_at',
      'delivered': 'delivered_at',
      'cancelled': 'cancelled_at'
    };
    
    let query = `
      UPDATE orders 
      SET 
        status = $2,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const params = [orderId, status];
    
    if (timestampColumns[status]) {
      query += `, ${timestampColumns[status]} = CURRENT_TIMESTAMP`;
    }
    
    query += ` WHERE id = $1`;
    
    if (driverId) {
      query += ` AND driver_id = $3`;
      params.push(driverId);
    }
    
    query += ` RETURNING *`;
    
    const result = await db.query(query, params);
    const order = result.rows[0];
    
    if (order) {
      // Emit real-time update
      emitOrderUpdate(order.id, {
        type: 'status_update',
        order,
        new_status: status
      });
      
      // Update driver status if delivered
      if (status === 'delivered') {
        await db.query(
          `UPDATE drivers SET current_status = 'available', is_available = true WHERE id = $1`,
          [driverId]
        );
        
        // Create earning record
        const driverEarnings = order.total_amount * 0.7; // 70% to driver (adjust as needed)
        await this.createEarning(order.id, driverId, null, driverEarnings, 30, order.total_amount * 0.3, driverEarnings);
      }
      
      // Create notification
      await this.createNotification(
        order.customer_id,
        'customer',
        'Order Update',
        `Your order status has changed to: ${status.replace(/_/g, ' ')}`,
        'status_update',
        { order_id: orderId, status }
      );
    }
    
    return order;
  }

  // Get orders for user based on role
  static async getOrdersByUser(userId, userRole, filters = {}) {
    let baseQuery = '';
    const params = [];
    
    switch (userRole) {
      case 'customer':
        baseQuery = `
          SELECT o.*, r.name as restaurant_name
          FROM orders o
          JOIN restaurants r ON o.restaurant_id = r.id
          WHERE o.customer_id = (SELECT id FROM customers WHERE user_id = $1)
        `;
        params.push(userId);
        break;
        
      case 'driver':
        baseQuery = `
          SELECT o.*, r.name as restaurant_name, c.first_name as customer_first_name
          FROM orders o
          JOIN restaurants r ON o.restaurant_id = r.id
          JOIN customers cust ON o.customer_id = cust.id
          JOIN users c ON cust.user_id = c.id
          WHERE o.driver_id = (SELECT id FROM drivers WHERE user_id = $1)
        `;
        params.push(userId);
        break;
        
      case 'restaurant_manager':
        baseQuery = `
          SELECT o.*, c.first_name as customer_first_name
          FROM orders o
          JOIN customers cust ON o.customer_id = cust.id
          JOIN users c ON cust.user_id = c.id
          WHERE o.restaurant_id IN (
            SELECT id FROM restaurants 
            WHERE manager_id = (SELECT id FROM restaurant_managers WHERE user_id = $1)
          )
        `;
        params.push(userId);
        break;
        
      default:
        throw new Error('Invalid user role');
    }
    
    // Apply filters
    const { status, start_date, end_date, page = 1, limit = 20 } = filters;
    let paramIndex = params.length + 1;
    
    if (status) {
      baseQuery += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (start_date) {
      baseQuery += ` AND o.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      baseQuery += ` AND o.created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    baseQuery += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(baseQuery, params);
    return result.rows;
  }

  // Create notification
  static async createNotification(userId, userType, title, body, type, data = {}) {
    const query = `
      INSERT INTO notifications (user_id, user_type, title, body, type, data)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userId,
      userType,
      title,
      body,
      type,
      JSON.stringify(data)
    ]);
    
    return result.rows[0];
  }

  // Create earning record
  static async createEarning(orderId, driverId, restaurantId, amount, commissionPercentage, commissionAmount, netAmount) {
    const query = `
      INSERT INTO earnings (
        order_id,
        driver_id,
        restaurant_id,
        amount,
        commission_percentage,
        commission_amount,
        net_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      orderId,
      driverId,
      restaurantId,
      amount,
      commissionPercentage,
      commissionAmount,
      netAmount
    ]);
    
    return result.rows[0];
  }

  // Check for expired orders (cron job)
  static async processExpiredOrders() {
    const query = `
      UPDATE orders o
      SET 
        status = 'no_drivers_available',
        updated_at = CURRENT_TIMESTAMP
      FROM driver_order_queue q
      WHERE o.id = q.order_id
        AND q.is_active = true
        AND q.expires_at <= NOW()
        AND o.status = 'pending'
      RETURNING o.*
    `;
    
    const result = await db.query(query);
    
    // Mark queue as inactive
    if (result.rows.length > 0) {
      const expiredOrderIds = result.rows.map(row => row.id);
      await db.query(
        `UPDATE driver_order_queue SET is_active = false WHERE order_id = ANY($1)`,
        [expiredOrderIds]
      );
      
      // Create notifications for customers
      for (const order of result.rows) {
        await this.createNotification(
          order.customer_id,
          'customer',
          'No Drivers Available',
          'Sorry, no drivers were available to accept your order. Please try again.',
          'order_expired',
          { order_id: order.id }
        );
      }
    }
    
    return result.rows;
  }
}

module.exports = Order;