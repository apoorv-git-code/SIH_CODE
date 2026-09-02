const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');
const queueController = require('../controllers/queueController');
const syncController = require('../controllers/syncController');
const sosController = require('../controllers/sosController');

const {
  validateAppointment,
  checkValidation: checkAppointment
} = require('../validators/appointmentValidator');

const {
  validateProfile,
  checkValidation: checkProfile
} = require('../validators/profileValidator');

const {
  validateProfileBatch,
  checkValidation: checkProfileBatch
} = require('../validators/profileBatchValidator');

const {
  validateAshaSync,
  checkValidation: checkAshaSync
} = require('../validators/syncValidator');

const { sosGuard } = require('../validators/sosValidator');


// Debug: check that all required functions exist
console.log('--- API ROUTE CHECK ---');

console.log(
  'authController.getProfile:',
  typeof authController.getProfile
);

console.log(
  'authController.saveProfile:',
  typeof authController.saveProfile
);

console.log(
  'authController.syncProfiles:',
  typeof authController.syncProfiles
);

console.log(
  'queueController.getQueue:',
  typeof queueController.getQueue
);

console.log(
  'queueController.bookAppointment:',
  typeof queueController.bookAppointment
);

console.log(
  'validateAppointment:',
  typeof validateAppointment
);

console.log(
  'checkAppointment:',
  typeof checkAppointment
);

console.log(
  'syncController.getSyncHistory:',
  typeof syncController.getSyncHistory
);

console.log(
  'syncController.syncAshaRecords:',
  typeof syncController.syncAshaRecords
);

console.log(
  'sosController.dispatch:',
  typeof sosController.dispatch
);

console.log(
  'sosGuard:',
  typeof sosGuard
);

console.log('-----------------------');


// PROFILE
router.get(
  '/profile',
  authController.getProfile
);

router.post(
  '/profile',
  validateProfile,
  checkProfile,
  authController.saveProfile
);


// PROFILE SYNC
router.post(
  '/sync/profiles',
  validateProfileBatch,
  checkProfileBatch,
  authController.syncProfiles
);


// QUEUE
router.get(
  '/queue',
  queueController.getQueue
);


// APPOINTMENTS
router.post(
  '/appointments',
  validateAppointment,
  checkAppointment,
  queueController.bookAppointment
);


// ASHA SYNC
router.get(
  '/sync/asha',
  syncController.getSyncHistory
);

router.post(
  '/sync/asha',
  validateAshaSync,
  checkAshaSync,
  syncController.syncAshaRecords
);


// SOS
router.post(
  '/sos',
  sosGuard,
  sosController.dispatch
);


// HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'gram-arogya-connect-api',
    db: req.app.get('dbStatus')
      ? req.app.get('dbStatus')()
      : 'unknown'
  });
});


module.exports = router;