const { body, validationResult } = require('express-validator');

const validateAshaSync = [
  body('records').isArray({ min: 1, max: 500 }).withMessage('records must be a non-empty array (max 500 per batch)'),
  body('records.*.clientRecordId').isString().trim().isLength({ min: 8, max: 100 }),
  body('records.*.ashaId').isString().trim().isLength({ min: 1, max: 50 }),
  body('records.*.village').isString().trim().isLength({ min: 1, max: 100 }),
  body('records.*.visitedAt').isISO8601().withMessage('visitedAt must be a valid date'),
  body('records.*.notes').optional().isString().trim().isLength({ max: 1000 })
];

function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
}

module.exports = { validateAshaSync, checkValidation };