/**
 * src/controllers/authController.js
 * Gram Arogya Connect (SIH 2026, PS #26133)
 *
 * Handles patient health profile retrieval and updates.
 * PRIVACY NOTE: ABHA (Ayushman Bharat Health Account) IDs are NEVER stored,
 * validated, or displayed in unmasked form. Only the last 4 digits are
 * retained for display purposes, formatted as "91-XXXX-XXXX-1234".
 *
 * Wired via src/routes/api.js:
 *   GET  /api/v1/profile  -> getProfile
 *   POST /api/v1/profile  -> saveProfile
 */

// ---------------------------------------------------------------------------
// Mock in-memory patient state (replace with DB layer, e.g. Mongoose/Prisma)
// ---------------------------------------------------------------------------
let mockPatientProfile = {
  patientId: "PID-GAC-00042",
  name: "Rambha Devi",
  age: 54,
  gender: "Female",
  bloodGroup: "B+",
  abhaIdMasked: "91-XXXX-XXXX-1234",
  village: "Chandapur",
  primaryHealthCenter: "PHC Chandapur North",
  vitals: {
    heightCm: 152,
    weightKg: 58,
    bpSystolic: 128,
    bpDiastolic: 84,
    pulseBpm: 76,
    spo2Percent: 97,
    lastRecordedAt: new Date().toISOString(),
  },
  allergies: ["Penicillin", "Dust"],
  chronicConditions: ["Type 2 Diabetes", "Hypertension"],
  lastUpdatedAt: new Date().toISOString(),
};

/**
 * Utility: mask any incoming ABHA-like identifier down to last 4 digits.
 * Ensures no raw government ID is ever persisted in mock state.
 * @param {string} rawId
 * @returns {string}
 */
function maskAbhaId(rawId) {
  if (typeof rawId !== "string" || rawId.trim().length === 0) {
    return mockPatientProfile.abhaIdMasked;
  }
  const digitsOnly = rawId.replace(/\D/g, "");
  const last4 = digitsOnly.slice(-4).padStart(4, "X");
  return `91-XXXX-XXXX-${last4}`;
}

/**
 * GET /api/v1/profile
 * Returns the mock patient's health profile with masked identifiers.
 */
async function getProfile(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: "Patient profile retrieved successfully.",
      data: mockPatientProfile,
    });
  } catch (error) {
    console.error("[authController.getProfile] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve patient profile.",
      data: null,
    });
  }
}

/**
 * POST /api/v1/profile
 * Accepts partial profile updates and merges them into mock state.
 * Any ABHA ID field in the payload is masked before storage.
 */
async function saveProfile(req, res) {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Expected a profile update object.",
        data: null,
      });
    }

    // Never allow raw ABHA numbers to pass through unmasked.
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.abhaId || sanitizedUpdates.abhaIdMasked) {
      sanitizedUpdates.abhaIdMasked = maskAbhaId(
        sanitizedUpdates.abhaId || sanitizedUpdates.abhaIdMasked
      );
      delete sanitizedUpdates.abhaId; // raw field is never persisted
    }

    // Deep-merge vitals separately so partial vitals updates don't wipe others.
    if (sanitizedUpdates.vitals && typeof sanitizedUpdates.vitals === "object") {
      mockPatientProfile.vitals = {
        ...mockPatientProfile.vitals,
        ...sanitizedUpdates.vitals,
        lastRecordedAt: new Date().toISOString(),
      };
      delete sanitizedUpdates.vitals;
    }

    mockPatientProfile = {
      ...mockPatientProfile,
      ...sanitizedUpdates,
      lastUpdatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: "Patient profile saved successfully.",
      data: mockPatientProfile,
    });
  } catch (error) {
    console.error("[authController.saveProfile] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save patient profile.",
      data: null,
    });
  }
}

module.exports = {
  getProfile,
  saveProfile,
};
