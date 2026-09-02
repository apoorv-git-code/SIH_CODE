const { body, validationResult } = require('express-validator');

const validateAppointment = [
  body('patientName').isString().trim().isLength({ min: 1, max: 100 }),
  body('slotId').isString().trim().isLength({ min: 1, max: 50 })
];

function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
}

module.exports = { validateAppointment, checkValidation };