require('dotenv').config();
const http = require('http');
const app = require('./app');
const { testConnection } = require('./config/db');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Test DB connection then start server
testConnection().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Son Chayan Server running on port ${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
