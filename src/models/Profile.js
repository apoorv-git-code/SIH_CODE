// src/models/Profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: String,
  village: String,
  abhaMasked: String,       // NEVER a real ID — masked mock only, per your README's privacy guarantee
  vitals: {
    bp: String,
    sugar: String,
    weight: Number
  }
}, { timestamps: true });    // auto-adds createdAt/updatedAt

module.exports = mongoose.model('Profile', profileSchema);