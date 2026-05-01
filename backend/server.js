const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

const CORS_MODE = process.env.CORS_MODE || 'dynamic';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedPatterns = (process.env.ALLOWED_ORIGIN_PATTERNS || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);


const originChecker = (origin, callback) => {
  // Same-origin requests (mobile apps, Postman, curl) have no Origin header
  if (!origin) return callback(null, true);

  if (CORS_MODE === 'open') {
    return callback(null, true);
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  // 2. Wildcard pattern match from ALLOWED_ORIGIN_PATTERNS list
  const matchesPattern = allowedPatterns.some((pattern) =>
    origin.endsWith(pattern)
  );
  if (matchesPattern) {
    return callback(null, true);
  }

  // 3. In dynamic mode also allow localhost on any port (useful for team devs)
  if (CORS_MODE === 'dynamic' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }

  // Blocked
  console.warn(`[CORS] Blocked origin: ${origin}`);
  callback(new Error(`CORS policy: origin ${origin} is not allowed`));
};

const corsOptions = {
  origin: originChecker,
  credentials: true,                         // allow Authorization / cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,                 // some legacy browsers choke on 204
};

// Apply CORS globally + handle preflight OPTIONS on all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));         // explicit preflight handler


//  Standard middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//  Routes
app.use('/api/auth',                        require('./routes/authRoutes'));
app.use('/api/listings',                    require('./routes/listingRoutes'));
app.use('/api/listings/:listingId/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin',                       require('./routes/adminRoutes'));

app.get('/', (req, res) => {
  res.json({
    message: 'Yum API running',
    cors: {
      mode:     CORS_MODE,
      origins:  allowedOrigins,
      patterns: allowedPatterns,
    },
  });
});

//  Error handlers
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  // Surface CORS errors clearly
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ message: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

//  Boot
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    console.log(`CORS mode: ${CORS_MODE}`);
    if (allowedOrigins.length)  console.log(`   Origins:  ${allowedOrigins.join(', ')}`);
    if (allowedPatterns.length) console.log(`   Patterns: ${allowedPatterns.join(', ')}`);
    app.listen(process.env.PORT || 5001, () => {
      console.log(`Server running on port ${process.env.PORT || 5001}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });