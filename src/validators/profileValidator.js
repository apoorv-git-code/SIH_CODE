const { body, validationResult } = require('express-validator');

const validateProfile = [
  body('clientRecordId').isString().trim().isLength({ min: 8, max: 100 }),
  body('capturedAt').isISO8601().withMessage('capturedAt must be a valid date'),
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('village').isString().trim().isLength({ min: 1, max: 100 }),
  body('abhaMasked')
    .optional()
    .isString()
    .trim()
    .custom((value) => {
      const looksRaw = /^\d{10,14}$/.test(value.replace(/\s|-/g, ''));
      if (looksRaw) throw new Error('abhaMasked must not be a raw ID number');
      return true;
    }),
  body('vitals.bp').optional().isString().trim().isLength({ max: 20 }),
  body('vitals.sugar').optional().isString().trim().isLength({ max: 20 }),
  body('vitals.weight').optional().isFloat({ min: 0, max: 500 })
];

function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
}

module.exports = { validateProfile, checkValidation };