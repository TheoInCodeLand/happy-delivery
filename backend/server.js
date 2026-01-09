const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
// const socketIo = require('socket.io'); // Remove this unused line
const rateLimit = require('express-rate-limit');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

dotenv.config();

const authRoutes = require('./src/routes/authRoutes');
const restaurantRoutes = require('./src/routes/restaurantRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const driverRoutes = require('./src/routes/driverRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const userRoutes = require('./src/routes/userRoutes');
const menuRoutes = require('./src/routes/menuRoutes');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from your app
  }
});

// ---------------------------------------------------------
// 🚨 CRITICAL FIX: Make 'io' accessible to your Controllers
// ---------------------------------------------------------
app.set('io', io); 

// Handle Connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Drivers join a specific "drivers" room to receive updates
  socket.on('join_driver_room', () => {
    socket.join('drivers');
    console.log(`Socket ${socket.id} joined drivers room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  message: 'Too many requests from this IP, please try again later.'
});

// 1. Setup View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Setup Public Folder (for CSS/Images)
app.use(express.static(path.join(__dirname, 'public')));

// 3. Setup Session (Required for Web Login)
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'manager_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

app.use('/api/', limiter);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);

const managerWebRoutes = require('./routes/managerWeb');
app.use('/manager', managerWebRoutes);

// Socket.io setup 
// require('./src/socket')(io); // You can keep or comment this out depending on if you use separate logic

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Base URL on localhost: http://localhost:${PORT}`);
  // Note: Update this IP if your network changes
  console.log(`Base URL on IPv4: http://10.216.251.95:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(' CRITICAL UNHANDLED REJECTION:', err);
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});

module.exports = { app, server };