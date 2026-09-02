const mongoose = require('mongoose');
const { isNotRawIdNumber } = require('../utils/idGuard');

const profileSchema = new mongoose.Schema({
  clientRecordId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  village: {
    type: String,
    required: true
  },
  abhaMasked: {
    type: String,
    validate: {
      validator: isNotRawIdNumber,
      message: 'Refusing to store unmasked ID-like values'
    }
  },
  vitals: {
    bp: String,
    sugar: String,
    weight: Number
  },
  capturedAt: {
    type: Date,
    required: true
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);