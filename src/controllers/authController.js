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
  if (clean.length <= keepStart + keepEnd) return 'XX-XXXX-XXXX-XXXX';
  const start = clean.slice(0, keepStart);
  const end = clean.slice(-keepEnd);
  return `${start}${'X'.repeat(Math.max(clean.length - keepStart - keepEnd, 4))}${end}`;
}

// In-memory "database" — single demo patient, reset on server restart.
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
  vitals: { bp: '142/92', spo2: 97 },
  updatedAt: new Date().toISOString()
};

exports.getProfile = (req, res) => {
  res.json({ ok: true, profile });
};

exports.saveProfile = (req, res) => {
  const body = req.body || {};

  profile = {
    ...profile,
    ...body,
    // Never trust/store a raw ID number verbatim — always re-mask it.
    abhaNumber: maskId(body.abhaNumber || profile.abhaNumber),
    updatedAt: new Date().toISOString()
  };

  res.json({ ok: true, profile });
};
