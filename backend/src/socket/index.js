module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Join user to their room based on user ID
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });
    
    // Join driver to driver room
    socket.on('join_driver', (driverId) => {
      socket.join(`driver_${driverId}`);
      console.log(`Driver ${driverId} joined driver room`);
    });
    
    // Join order room for real-time updates
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Client joined order room: ${orderId}`);
    });
    
    // Handle location updates from drivers
    socket.on('driver_location_update', (data) => {
      const { driverId, orderId, location } = data;
      
      // Broadcast to order room
      io.to(`order_${orderId}`).emit('driver_location', {
        driverId,
        location,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Driver ${driverId} location updated for order ${orderId}`);
    });
    
    // Handle order status updates
    socket.on('order_status_update', (data) => {
      const { orderId, status, userId } = data;
      
      // Notify customer
      io.to(`user_${userId}`).emit('order_update', {
        orderId,
        status,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Order ${orderId} status updated to ${status}`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

// Helper function to emit order updates
function emitOrderUpdate(orderId, data) {
  const io = require('socket.io').get();
  io.to(`order_${orderId}`).emit('order_update', data);
}

module.exports.emitOrderUpdate = emitOrderUpdate;

let ioInstance;

module.exports = (io) => {
  ioInstance = io; // Store the instance for the helper function
  
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Join user to their room based on user ID
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });
    
    // Join driver to driver room
    socket.on('join_driver', (driverId) => {
      socket.join(`driver_${driverId}`);
      console.log(`Driver ${driverId} joined driver room`);
    });
    
    // Join order room for real-time updates
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Client joined order room: ${orderId}`);
    });
    
    // Handle location updates from drivers
    socket.on('driver_location_update', (data) => {
      const { driverId, orderId, location } = data;
      
      // Broadcast to order room
      io.to(`order_${orderId}`).emit('driver_location', {
        driverId,
        location,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Driver ${driverId} location updated for order ${orderId}`);
    });
    
    // Handle order status updates
    socket.on('order_status_update', (data) => {
      const { orderId, status, userId } = data;
      
      // Notify customer
      io.to(`user_${userId}`).emit('order_update', {
        orderId,
        status,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Order ${orderId} status updated to ${status}`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

};

function emitOrderUpdate(orderId, data) {
  if (ioInstance) {
    ioInstance.to(`order_${orderId}`).emit('order_update', data);
  }
}

module.exports.emitOrderUpdate = emitOrderUpdate;