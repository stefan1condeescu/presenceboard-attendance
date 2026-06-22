require('dotenv').config({ quiet: true });

const cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./config/database');
require('./models');

const { organizerRouter } = require('./routes/organizerRoutes');
const { eventGroupRouter } = require('./routes/eventGroupRoutes');
const { eventRouter } = require('./routes/eventRoutes');
const { attendanceRouter } = require('./routes/attendanceRoutes');
const { quoteRouter } = require('./routes/quoteRoutes');

const app = express();

function getAllowedOrigins() {
  const configured = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '';
  const origins = configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length > 0) {
    return origins;
  }

  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
}

function isSameOrigin(origin, req) {
  try {
    const originUrl = new URL(origin);
    return originUrl.host === req.get('host');
  } catch {
    return false;
  }
}

function getCorsOptions(req, callback) {
  const origin = req.header('Origin');
  const allowedOrigins = getAllowedOrigins();

  callback(null, {
    origin: !origin || isSameOrigin(origin, req) || allowedOrigins.includes(origin),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}

app.use('/api', cors(getCorsOptions));

app.options('/api/*splat', cors(getCorsOptions));

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PresenceBoard API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/organizers', organizerRouter);
app.use('/api/event-groups', eventGroupRouter);
app.use('/api/events', eventRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/quotes', quoteRouter);

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'PresenceBoard API is running. Build the frontend to serve the full app from this server.',
    });
  });
}

module.exports = { app, sequelize };
