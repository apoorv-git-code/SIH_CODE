const mongoose = require('mongoose');

const ashaSyncSchema = new mongoose.Schema({
  clientRecordId: {
    type: String,
    required: true,
    unique: true
  },
  ashaId: {
    type: String,
    required: true
  },
  village: {
    type: String,
    required: true
  },
  visitedAt: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('AshaSyncRecord', ashaSyncSchema);