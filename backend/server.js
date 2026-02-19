//backend/server.js
require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const { startJobs } = require('./src/jobs');

const PORT = process.env.PORT || 5000;

// PostgreSQL connection
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'flixvideo',
});

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flixvideo';
let mongoClient;

async function startServer() {
  try {
    console.log('🚀 Starting FlixVideo Backend...\n');

    // Test PostgreSQL connection
    console.log('🔌 Connecting to PostgreSQL...');
    const pgResult = await pgPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');

    // Test MongoDB connection
    console.log('🔌 Connecting to MongoDB...');
    mongoClient = new MongoClient(mongoURI);
    await mongoClient.connect();
    await mongoClient.db().command({ ping: 1 });
    console.log('✅ MongoDB connected');

    console.log('');

    // Make connections available globally
    global.pgPool = pgPool;
    global.mongoClient = mongoClient;

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    const io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Make io accessible to routes
    app.set('io', io);

    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log(`✅ Socket connected: ${socket.id}`);
      
      socket.on('disconnect', () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
      });
    });

    // Initialize watch party socket handlers
    require('./src/sockets/watchParty.socket')(io);

    // Start server
    server.listen(PORT, '0.0.0.0', async () => {
      console.log('╔════════════════════════════════════════╗');
      console.log('║   🎬 FlixVideo API Server Running    ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');
      console.log(`📡 Server:      http://localhost:${PORT}`);
      console.log(`📚 API Docs:    http://localhost:${PORT}/api-docs`);
      console.log(`🔌 WebSocket:   ws://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started:     ${new Date().toLocaleString()}`);
      console.log('');
      console.log('📋 Quick Links:');
      console.log(`   → Home:      http://localhost:${PORT}/`);
      console.log(`   → Health:    http://localhost:${PORT}/health`);
      console.log('');
      
      // Start background jobs
      try {
        console.log('🔄 Starting background jobs...');
        await startJobs();
        console.log('');
      } catch (error) {
        console.error('⚠️  Failed to start background jobs:', error.message);
        console.log('');
      }
      
      console.log('✨ Ready to accept requests!');
      console.log('🎮 WebSocket ready for watch parties!');
      console.log('');
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n👋 ${signal} received, shutting down gracefully...`);
      
      // Close Socket.io connections
      io.close(() => {
        console.log('🔌 Socket.io connections closed');
      });
      
      // Close HTTP server
      server.close(() => {
        console.log('🛑 HTTP server closed');
      });
      
      // Close database connections
      await pgPool.end();
      console.log('🗄️  PostgreSQL connection closed');
      
      if (mongoClient) {
        await mongoClient.close();
        console.log('🗄️  MongoDB connection closed');
      }
      
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('');
    console.error('❌ Failed to start server:');
    console.error(error.message);
    console.error('');
    process.exit(1);
  }
}

// Start the server
startServer();