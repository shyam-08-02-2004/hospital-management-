const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
// xss-clean removed — it corrupts JSON bodies in Node 18+ (known bug)
const rateLimit = require('express-rate-limit');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// --- Security & parsing middleware ---
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        process.env.CLIENT_URL,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ];
      if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . from req.body/query/params keys

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Global rate limiter — applies to all API routes
const limiter = rateLimit({
  windowMs: (Number(process.env.RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : (Number(process.env.RATE_LIMIT_MAX) || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Static file serving for locally stored uploads (fallback when not using Cloudinary)
app.use('/uploads', express.static('uploads'));

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'HMS API is healthy', timestamp: new Date().toISOString() });
});

const runSeed = require('./controllers/seedController');
app.get('/api/seed', runSeed);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/reports', require('./routes/medicalReportRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/cron', require('./routes/cronRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
