require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const seedDatabase = require('./utils/seedData');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET','POST'] }
});

// Make io accessible in controllers via app.locals
app.locals.io = io;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/reviews', require('./routes/reviews'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'RideX API running' }));
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// SOCKET.IO
const connectedUsers = new Map();
io.on('connection', (socket) => {
  socket.on('join', ({ userId, role }) => {
    connectedUsers.set(userId.toString(), socket.id);
    socket.join(userId.toString());
    socket.userId = userId.toString();
    console.log(`${role} [${userId}] joined`);
  });
  socket.on('driverLocation', ({ riderId, lat, lng, driverName }) => {
    io.to(riderId.toString()).emit('driverMoved', { lat, lng, driverName });
  });
  socket.on('rideUpdate', (data) => {
    if (data.targetUserId) io.to(data.targetUserId.toString()).emit('rideStatus', data);
  });
  socket.on('markRead', async ({ notificationId }) => {
    try {
      await require('./models/Notification').findByIdAndUpdate(notificationId, { isRead: true });
    } catch {}
  });
  socket.on('disconnect', () => {
    if (socket.userId) connectedUsers.delete(socket.userId);
  });
});

module.exports = { app, io, connectedUsers };

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedDatabase();
    server.listen(PORT, () => {
      console.log(`RideX Server -> http://localhost:${PORT}`);
    });
  })
  .catch(err => { console.error('MongoDB failed:', err.message); process.exit(1); });
