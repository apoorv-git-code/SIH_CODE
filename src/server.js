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
const { sanitize, apiLimiter } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:4000',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);
app.set('dbStatus', dbStatus);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:4000' }));
app.use(express.json());
app.use(sanitize);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/v1', apiLimiter, apiRoutes);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  socket.on('join:subcentre', (subCentreId) => {
    if (typeof subCentreId !== 'string' || !/^[a-zA-Z0-9_-]{1,50}$/.test(subCentreId)) return;
    socket.join(`subcentre:${subCentreId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

setInterval(() => queueController.tick(io), 4000);

app.use(notFound);
app.use(errorHandler);

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