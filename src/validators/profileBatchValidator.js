const { body, validationResult } = require('express-validator');

const validateProfileBatch = [
  body('records').isArray({ min: 1, max: 200 }).withMessage('records must be a non-empty array (max 200 per batch)'),
  body('records.*.clientRecordId').isString().trim().isLength({ min: 8, max: 100 }),
  body('records.*.capturedAt').isISO8601().withMessage('each record needs a valid capturedAt date'),
  body('records.*.name').isString().trim().isLength({ min: 1, max: 100 }),
  body('records.*.village').isString().trim().isLength({ min: 1, max: 100 }),
  body('records.*.abhaMasked')
    .optional()
    .isString()
    .trim()
    .custom((value) => {
      const looksRaw = /^\d{10,14}$/.test(value.replace(/\s|-/g, ''));
      if (looksRaw) throw new Error('abhaMasked must not be a raw ID number');
      return true;
    }),
  body('records.*.vitals.bp').optional().isString().trim().isLength({ max: 20 }),
  body('records.*.vitals.sugar').optional().isString().trim().isLength({ max: 20 }),
  body('records.*.vitals.weight').optional().isFloat({ min: 0, max: 500 })
];

function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
}

module.exports = { validateProfileBatch, checkValidation };