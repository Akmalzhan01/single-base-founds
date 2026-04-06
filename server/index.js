require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');
const connectDB = require('./src/config/db');
const { initBot } = require('./src/services/telegramBot');

const app = express();

// DB
connectDB();

// Middleware
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/beneficiaries', require('./src/routes/beneficiaryRoutes'));
app.use('/api/aid-records', require('./src/routes/aidRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/foundations', require('./src/routes/foundationRoutes'));
app.use('/api/notices', require('./src/routes/noticeRoutes'));
app.use('/api/audit', require('./src/routes/auditRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));

// Serve React client in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.message = 'Жарамсыз токен';
  }
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Сервер катасы',
  });
});

// Telegram bot
initBot();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
