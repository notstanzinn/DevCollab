require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const setupCollabSockets = require('./sockets/collab');

// Route imports
const authRoutes         = require('./routes/auth');
const snippetRoutes      = require('./routes/snippets');
const userRoutes         = require('./routes/users');
const paymentRoutes      = require('./routes/payments');
const adminRoutes        = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

// Allowed origins (dev + production)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

const originFn = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, Render health checks)
  if (!origin || allowedOrigins.includes(origin)) callback(null, true);
  else callback(new Error('Not allowed by CORS'));
};

const app    = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: { origin: originFn, credentials: true },
});
setupCollabSockets(io);

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));

// CORS
app.use(cors({ origin: originFn, credentials: true }));

// Stripe webhook needs raw body — must come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api/auth',          authRoutes);
app.use('/api/snippets',      snippetRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React build in production
const publicDir = path.join(__dirname, 'public');
if (process.env.NODE_ENV === 'production' && fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // All non-API routes → React's index.html (client-side routing)
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// 404 handler (unmatched /api routes)
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
