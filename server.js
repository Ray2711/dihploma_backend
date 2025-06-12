// server.js
require('dotenv').config();
const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const rateLimit     = require('express-rate-limit');

const authRoutes    = require('./routes/auth');
const resumeRoutes  = require('./routes/resume');
const chatRoutes   = require('./routes/chat');
const coverRoutes   = require('./routes/coverletter');

const app = express();
app.set('trust proxy', 1 /* number of proxies between user and server */)

// 1) Security headers
app.use(helmet());

// 2) CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));

// 3) Body parser
app.use(express.json());

// 4) Rate limiting
const authLimiter = rateLimit({
  windowMs: 15*60*1000, // 15 min
  max:  50,
  message: 'Too many auth requests; please try again later.'
});
const resumeLimiter = rateLimit({
  windowMs: 15*60*1000,
  max: 100,
  message: 'Too many resume requests; please try again later.'
});
const chatLimiter   = rateLimit({ windowMs:60*1000, max:20,  message:'Too many chat requests; please try later.' });
const coverLimiter   = rateLimit({ windowMs:60*1000, max:20,  message:'Too many chat requests; please try later.' });

// 5) Mount routes with their respective limiters
app.use('/api/auth',   authLimiter,   authRoutes);
app.use('/api/resume', resumeLimiter, resumeRoutes);
app.use('/api/build',   chatLimiter,   chatRoutes);
app.use('/api/cover',   coverLimiter,   coverRoutes);



// 6) Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));