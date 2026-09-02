const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const sanitize = mongoSanitize();

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please slow down' }
});

module.exports = { sanitize, apiLimiter };