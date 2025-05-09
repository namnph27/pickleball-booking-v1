/**
 * Socket.io Service
 * Handles real-time communication for notifications
 */
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 */
const initialize = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Join user's room for private notifications
    socket.join(`user:${socket.user.id}`);
    
    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  console.log('Socket.io server initialized');
};

/**
 * Send notification to a specific user
 * @param {number} userId - User ID
 * @param {Object} notification - Notification object
 */
const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
};

/**
 * Send join request notification to a user
 * @param {number} userId - User ID
 * @param {Object} joinRequest - Join request object
 */
const sendJoinRequestNotification = (userId, joinRequest) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  io.to(`user:${userId}`).emit('join_request', joinRequest);
};

/**
 * Send join request response notification to a user
 * @param {number} userId - User ID
 * @param {Object} response - Response object
 */
const sendJoinRequestResponseNotification = (userId, response) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  io.to(`user:${userId}`).emit('join_request_response', response);
};

/**
 * Broadcast message to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const broadcast = (event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  io.emit(event, data);
};

module.exports = {
  initialize,
  sendNotificationToUser,
  sendJoinRequestNotification,
  sendJoinRequestResponseNotification,
  broadcast
};
