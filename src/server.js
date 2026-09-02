// src/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB, dbStatus } = require('./config/db');
const apiRoutes = require('./routes/api');
const queueController = require('./controllers/queueController');

const app = express();
const server = http.createServer(app);           // raw HTTP server — Socket.io needs this, not just `app`

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:4000',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);                                 // lets controllers do req.app.get('io').emit(...)
app.set('dbStatus', dbStatus);                      // expose to routes (used by /health)

// ---- Middleware chain (order matters, top to bottom) ----
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:4000' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---- Routes ----
app.use('/api/v1', apiRoutes);

// SPA fallback — must come after /api/v1 mount, before error handlers
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ---- Socket.io: real-time queue ----
io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  socket.on('join:subcentre', (subCentreId) => {
    socket.join(`subcentre:${subCentreId}`);        // scoped rooms, not a global broadcast
  });

  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

setInterval(() => queueController.tick(io), 4000);

// ---- Error handling (must be LAST) ----
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ ok: false, error: err.message || 'Internal server error' });
});

// ---- Boot sequence ----
const PORT = process.env.PORT || 4000;

connectDB().finally(() => {
  server.listen(PORT, () => {
    console.log(`Gram Arogya Connect running on http://localhost:${PORT} (db: ${dbStatus()})`);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});