let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    io = new Server(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
    });

    const jwt = require('jsonwebtoken');
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        try {
          const secret = process.env.JWT_SECRET || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
          const decoded = jwt.verify(token, secret);
          socket.userId = decoded.id;
        } catch (err) {
          // Token verification error
        }
      }
      next();
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      if (socket.userId) {
        socket.join(`user_${socket.userId}`);
        console.log(`Socket ${socket.id} automatically joined room user_${socket.userId}`);
      }
      
      // Clients can join rooms based on their user ID or district/sector ID for targeted notifications
      socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
