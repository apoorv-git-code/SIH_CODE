require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const apiRoutes = require('./routes/api');
const queueController = require('./controllers/queueController');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

app.use(cors());
app.use(express.json());

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// API
app.use('/api/v1', apiRoutes);

// SPA-style fallback for any non-API route -> serve index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

// Slowly advance the shared demo queue every 4s and broadcast it —
// mirrors the pacing of the original client-only setInterval simulation.
setInterval(() => queueController.tick(io), 4000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Gram Arogya Connect server running on http://localhost:${PORT}`);
});

const cors = require('cors');
app.use(cors({ origin: 'https://apoorv-git-code.github.io' }));

const io = require('socket.io')(server, {
  cors: {
    origin: "https://apoorv-git-code.github.io",
    methods: ["GET", "POST"]
  }
});
