// src/routes/api.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const queueController = require('../controllers/queueController');
const syncController = require('../controllers/syncController');
const sosController = require('../controllers/sosController');

// ---- Profile / ABHA ----
router.route('/profile')
  .get(authController.getProfile)
  .post(authController.saveProfile);

// ---- Appointments & live queue ----
router.get('/queue', queueController.getQueue);
router.post('/appointments', queueController.bookAppointment);

// ---- Offline ASHA sync ----
router.route('/sync/asha')
  .get(syncController.getSyncHistory)
  .post(syncController.syncAshaRecords);

// ---- Emergency, with a basic cooldown guard ----
const sosCooldown = new Map(); // ip -> last dispatch timestamp (ms)

router.post('/sos', (req, res, next) => {
  const key = req.ip;
  const last = sosCooldown.get(key) || 0;
  if (Date.now() - last < 10000) {
    return res.status(429).json({ ok: false, error: 'SOS already dispatched — please wait before retrying' });
  }
  sosCooldown.set(key, Date.now());
  next();
}, sosController.dispatch);

// ---- Health check, now DB-aware ----
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'gram-arogya-connect-api',
    db: req.app.get('dbStatus')()
  });
});

module.exports = router;