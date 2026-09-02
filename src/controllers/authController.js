/**
 * authController.js
 * Mock, in-memory patient profile / ABHA identity endpoints.
 *
 * PRIVACY GUARDRAIL: this backend never stores or validates a real ABHA,
 * Aadhaar, or ration-card number. Whatever the client sends is masked
 * before it is echoed back, and the seed record below is a placeholder.
 */

function maskId(value, keepStart = 2, keepEnd = 4) {
  if (!value) return 'XX-XXXX-XXXX-XXXX';

  const clean = String(value).replace(/\s+/g, '');

  if (clean.length <= keepStart + keepEnd) {
    return 'XX-XXXX-XXXX-XXXX';
  }

  const start = clean.slice(0, keepStart);
  const end = clean.slice(-keepEnd);

  return `${start}${'X'.repeat(
    Math.max(clean.length - keepStart - keepEnd, 4)
  )}${end}`;
}


// ========================================
// IN-MEMORY PATIENT PROFILE
// ========================================

let profile = {
  name: 'Sunita Tai More',
  abhaNumber: maskId('914523887190XX'),
  abhaAddress: 'sunitatai.more@abdm',
  age: 34,
  gender: 'Female',
  bloodGroup: 'B+',
  village: 'Vadgaon, Raigad',
  rationCard: 'yellow',
  conditions: 'Primary Hypertension (Stage 1), Giddiness on exertion',
  allergies: 'Sulfa Drugs (Mild rash)',
  maternalStatus: 'no',

  vitals: {
    bp: '142/92',
    spo2: 97
  },

  updatedAt: new Date().toISOString()
};


// ========================================
// GET PROFILE
// ========================================

exports.getProfile = (req, res) => {
  res.json({
    ok: true,
    profile
  });
};


// ========================================
// SAVE PROFILE
// ========================================

exports.saveProfile = (req, res) => {
  const body = req.body || {};

  profile = {
    ...profile,
    ...body,

    // Never store a raw ID number.
    abhaNumber: maskId(
      body.abhaNumber || profile.abhaNumber
    ),

    updatedAt: new Date().toISOString()
  };

  res.json({
    ok: true,
    profile
  });
};


// ========================================
// SYNC OFFLINE PROFILES
// ========================================

exports.syncProfiles = (req, res) => {
  const body = req.body || {};

  // Expecting something like:
  // {
  //   "profiles": [
  //      {...},
  //      {...}
  //   ]
  // }

  const profiles = Array.isArray(body.profiles)
    ? body.profiles
    : [];

  const syncedProfiles = profiles.map((item) => ({
    ...item,

    // Mask ABHA before returning anything
    abhaNumber: maskId(item.abhaNumber),

    syncedAt: new Date().toISOString()
  }));

  res.json({
    ok: true,
    message: 'Profiles synced successfully',
    count: syncedProfiles.length,
    profiles: syncedProfiles
  });
};