// src/models/AshaSyncRecord.js
const mongoose = require('mongoose');

const ashaSyncSchema = new mongoose.Schema({
  ashaId: String,
  village: String,
  visitedAt: Date,
  notes: String,
  syncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AshaSyncRecord', ashaSyncSchema);