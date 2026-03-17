let ioInstance = null;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Admin joins admin room to receive real-time order notifications
    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log(`👤 Admin joined admin_room: ${socket.id}`);
    });

    // Customer joins their specific order room to receive live status updates
    // Client sends: { orderId, phone } for verification
    socket.on('track_order', ({ orderId, phone }) => {
      if (orderId && phone) {
        const room = `order_${orderId}`;
        socket.join(room);
        console.log(`📦 Customer tracking order ${orderId}: ${socket.id}`);
      }
    });

    // Authenticated customer joins their personal room to receive order updates
    socket.on('join_customer_room', ({ customerId }) => {
      if (customerId) {
        const room = `customer_${customerId}`;
        socket.join(room);
        console.log(`👤 Customer ${customerId} joined ${room}: ${socket.id}`);
      }
    });

    // Leave specific order room
    socket.on('leave_order', ({ orderId }) => {
      if (orderId) {
        socket.leave(`order_${orderId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
};

module.exports = { initSocket, getIO };
