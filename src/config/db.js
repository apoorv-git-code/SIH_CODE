const mongoose = require('mongoose');

let isDbConnected = false;

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn('[db] MONGO_URI not set — running in-memory only (no persistence).');
    isDbConnected = false;
    return false;
  }

  try {
    await mongoose.connect(uri);
    isDbConnected = true;
    console.log('[db] MongoDB connected');
    return true;
  } catch (err) {
    console.error('[db] Connection failed, falling back to in-memory mode:', err.message);
    isDbConnected = false;
    return false;
  }
}

function dbStatus() {
  return isDbConnected ? 'connected' : 'in-memory-fallback';
}

module.exports = { connectDB, dbStatus };