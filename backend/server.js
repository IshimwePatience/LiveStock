require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { connectDB } = require('./config/db');
const { sequelize } = require('./models');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));
app.use(morgan('dev'));

// Database Connection
connectDB();

// Routes
const authRoutes = require('./routes/authRoutes');
const movementRoutes = require('./routes/movementRoutes');
const traccarRoutes = require('./routes/traccarRoutes');
const otpRoutes = require('./routes/otpRoutes');
const vetRoutes = require('./routes/vetRoutes');
const caseRoutes = require('./routes/caseRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const gpsRoutes = require('./routes/gpsRoutes');
const driverRoutes = require('./routes/driverRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const geofenceRoutes = require('./routes/geofenceRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/movement', movementRoutes);
app.use('/api/traccar', traccarRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/vet', vetRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/geofence', geofenceRoutes);

// Socket.io for Real-time
const socketService = require('./services/socketService');
socketService.init(server);

// Sync Database
const autoSeed = require('./seeders/autoSeed');
sequelize.sync({ alter: true }).then(async () => {
  console.log('Database synced');
  await autoSeed();
}).catch(err => {
  console.error('Failed to sync db:', err);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
