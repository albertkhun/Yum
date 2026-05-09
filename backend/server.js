const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const path       = require('path');
const compression = require('compression');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

dotenv.config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression({
  level: 6,       // Balanced: good compression ratio, reasonable CPU cost
  threshold: 1024, // Don't compress responses under 1kB
  filter: (req, res) => {
    // Don't compress already-compressed media (images, video)
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// CORS 
const CORS_MODE        = process.env.CORS_MODE || 'dynamic';
const allowedOrigins   = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
const allowedPatterns  = (process.env.ALLOWED_ORIGIN_PATTERNS || '').split(',').map((p) => p.trim()).filter(Boolean);

const originChecker = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (CORS_MODE === 'open') return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  if (allowedPatterns.some((p) => origin.endsWith(p))) return callback(null, true);
  if (CORS_MODE === 'dynamic' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
  callback(new Error(`CORS policy: origin ${origin} is not allowed`));
};

const corsOptions = {
  origin: originChecker,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  etag:   true,
  lastModified: true,
}));


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                    // 20 auth attempts per 15 min per IP
  message: { message: 'Too many auth attempts, try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 120,             // 120 API calls per minute per IP (generous)
  message: { message: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // Don't rate-limit reads
});

app.use('/api/listings', (req, res, next) => {
  if (req.method === 'GET') {
    const ttl = req.path.match(/^\/[a-f0-9]{24}$/) ? 60 : 30;
    res.setHeader('Cache-Control', `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`);
  }
  next();
});

app.use('/api/listings/stats', (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  }
  next();
});

// Auth and write operations should never be cached
app.use('/api/auth',  (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

// ROUTES 
app.use('/api/auth',                        authLimiter, require('./routes/authRoutes'));
app.use('/api/listings',                    apiLimiter,  require('./routes/listingRoutes'));
app.use('/api/listings/:listingId/reviews',              require('./routes/reviewRoutes'));
app.use('/api/admin',                                    require('./routes/adminRoutes'));

app.get('/', (req, res) => {
  res.json({
    message: 'YumVR API running',
    cors: { mode: CORS_MODE, origins: allowedOrigins, patterns: allowedPatterns },
  });
});

//ERROR HANDLERS
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
  if (err.message?.startsWith('CORS policy')) {
    return res.status(403).json({ message: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

mongoose
  .connect(process.env.MONGO_URI, {
    maxPoolSize: parseInt(process.env.DB_POOL_SIZE || '5'),
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  })
  .then(() => {
    console.log('MongoDB connected');
    console.log(`CORS mode: ${CORS_MODE}`);

    const server = app.listen(process.env.PORT || 5001, () => {
      console.log(`Server on port ${process.env.PORT || 5001}`);
    });

    server.keepAliveTimeout = 65000;
    server.headersTimeout   = 66000;
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });