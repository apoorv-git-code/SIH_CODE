const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const queueController = require('../controllers/queueController');
const syncController = require('../controllers/syncController');
const sosController = require('../controllers/sosController');

// Profile / ABHA
router.get('/profile', authController.getProfile);
router.post('/profile', authController.saveProfile);

// Appointments & live queue
router.get('/queue', queueController.getQueue);
router.post('/appointments', queueController.bookAppointment);

// Offline ASHA sync
router.post('/sync/asha', syncController.syncAshaRecords);
router.get('/sync/asha', syncController.getSyncHistory);

// Emergency
router.post('/sos', sosController.dispatch);

router.get('/health', (req, res) => res.json({ ok: true, service: 'gram-arogya-connect-api' }));

module.exports = router;
