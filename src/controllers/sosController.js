/**
 * src/controllers/sosController.js
 * Gram Arogya Connect (SIH 2026, PS #26133)
 *
 * Handles emergency SOS dispatch triggers (e.g. "SOS-108" style ambulance
 * requests) from rural patients or ASHA workers. Emits a real-time
 * "sos:alert" event via Socket.io so dispatch control rooms and nearby
 * vehicle operators are notified instantly.
 *
 * Wired via src/routes/api.js:
 *   POST /api/v1/sos -> dispatch
 */

// ---------------------------------------------------------------------------
// Mock in-memory dispatch state (replace with DB + dispatch service in prod)
// ---------------------------------------------------------------------------
const mockDispatchLog = [];

const mockAvailableVehicles = [
  { vehicleId: "UP-108-AMB-014", type: "Basic Life Support Ambulance" },
  { vehicleId: "UP-108-AMB-027", type: "Advanced Life Support Ambulance" },
  { vehicleId: "UP-108-AMB-031", type: "Basic Life Support Ambulance" },
];

/**
 * Utility: generate a unique SOS dispatch ID, e.g. "SOS-108-4821".
 * @returns {string}
 */
function generateDispatchId() {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `SOS-108-${randomSuffix}`;
}

/**
 * Utility: pseudo-randomly assign an available vehicle and ETA based on
 * mock proximity logic. Replace with real geospatial dispatch algorithm.
 * @returns {{ vehicle: object, etaMins: number }}
 */
function assignVehicleAndEta() {
  const vehicle =
    mockAvailableVehicles[
      Math.floor(Math.random() * mockAvailableVehicles.length)
    ];
  const etaMins = Math.floor(8 + Math.random() * 17); // 8–24 mins
  return { vehicle, etaMins };
}

/**
 * POST /api/v1/sos
 * Accepts an emergency dispatch trigger with location and patient details,
 * assigns a vehicle, and broadcasts a real-time "sos:alert" event.
 * Expects: { patientName, location: { lat, lng, address }, emergencyType }
 */
async function dispatch(req, res) {
  try {
    const { patientName, location, emergencyType } = req.body;

    if (!patientName || typeof patientName !== "string") {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid 'patientName' field.",
        data: null,
      });
    }

    if (
      !location ||
      typeof location !== "object" ||
      typeof location.lat !== "number" ||
      typeof location.lng !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing or invalid 'location' field. Expected { lat: number, lng: number, address?: string }.",
        data: null,
      });
    }

    const dispatchId = generateDispatchId();
    const { vehicle, etaMins } = assignVehicleAndEta();
    const triggeredAt = new Date().toISOString();

    const dispatchRecord = {
      dispatchId,
      patientName,
      emergencyType: emergencyType || "General Emergency",
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address || "Address not provided",
      },
      assignedVehicle: vehicle,
      etaMins,
      status: "dispatched",
      triggeredAt,
    };

    mockDispatchLog.push(dispatchRecord);

    // Emit real-time SOS alert to dispatch control room / vehicle operators.
    // Socket.io is attached via app.set('io', io) in server.js.
    const io = req.app.get("io");
    if (io && typeof io.emit === "function") {
      io.emit("sos:alert", dispatchRecord);
    } else {
      console.warn(
        "[sosController.dispatch] Socket.io instance not found on app — skipping real-time emit."
      );
    }

    return res.status(201).json({
      success: true,
      message: "Emergency dispatch triggered successfully.",
      data: dispatchRecord,
    });
  } catch (error) {
    console.error("[sosController.dispatch] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to trigger emergency dispatch.",
      data: null,
    });
  }
}

module.exports = {
  dispatch,
};
