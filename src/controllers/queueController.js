/**
 * src/controllers/queueController.js
 * Gram Arogya Connect (SIH 2026, PS #26133)
 *
 * Handles live OPD token queue metrics and appointment booking.
 * Emits real-time queue updates via Socket.io so waiting-room displays and
 * patient apps stay in sync without polling.
 *
 * Wired via src/routes/api.js:
 *   GET  /api/v1/queue        -> getQueue
 *   POST /api/v1/appointments -> bookAppointment
 *
 * Also exports tick(io), called every 4s from server.js:
 *   setInterval(() => queueController.tick(io), 4000);
 * This advances the shared demo queue (nowServing/wait time drift) and
 * broadcasts the result, mirroring the pacing of the original client-only
 * setInterval simulation.
 *
 * NOTE: Socket.io is attached via `app.set('io', io)` in server.js, so
 * route handlers here read it with `req.app.get('io')` (there is no
 * `req.io` middleware in this project).
 */

// ---------------------------------------------------------------------------
// Mock in-memory queue state (replace with Redis/DB-backed queue in prod)
// ---------------------------------------------------------------------------
const mockQueueState = {
  facility: "PHC Chandapur North",
  nowServingPrefix: "A",
  nowServingNumber: 18,
  totalInQueue: 7,
  estimatedWaitMins: 35,
  lastTokenNumber: 23, // used to generate the next sequential booking token
  avgMinsPerPatient: 5,
};

function currentNowServing() {
  return `${mockQueueState.nowServingPrefix}-${mockQueueState.nowServingNumber}`;
}

function recalcEstimatedWait() {
  mockQueueState.estimatedWaitMins =
    mockQueueState.totalInQueue * mockQueueState.avgMinsPerPatient;
}

/**
 * Utility: generate the next sequential booking token, e.g. "A-24".
 * @param {string} prefix
 * @returns {string}
 */
function generateNextToken(prefix = "A") {
  mockQueueState.lastTokenNumber += 1;
  return `${prefix}-${mockQueueState.lastTokenNumber}`;
}

/**
 * Build the public-facing queue snapshot shared by REST responses and
 * socket broadcasts, so both stay in the same shape.
 */
function buildQueueSnapshot() {
  return {
    facility: mockQueueState.facility,
    nowServing: currentNowServing(),
    totalInQueue: mockQueueState.totalInQueue,
    estimatedWaitMins: mockQueueState.estimatedWaitMins,
  };
}

/**
 * GET /api/v1/queue
 * Returns current live token queue metrics for a facility.
 */
async function getQueue(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: "Queue status retrieved successfully.",
      data: buildQueueSnapshot(),
    });
  } catch (error) {
    console.error("[queueController.getQueue] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve queue status.",
      data: null,
    });
  }
}

/**
 * POST /api/v1/appointments
 * Books a new appointment token, updates queue counters, and broadcasts
 * a "queue:update" event to all connected Socket.io clients.
 * Expects: { patientName, facility, slot } in req.body
 */
async function bookAppointment(req, res) {
  try {
    const { patientName, facility, slot } = req.body;

    if (!patientName || !facility || !slot) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: patientName, facility, and slot are all required.",
        data: null,
      });
    }

    const tokenNumber = generateNextToken(mockQueueState.nowServingPrefix);

    mockQueueState.totalInQueue += 1;
    recalcEstimatedWait();

    const bookingDetails = {
      tokenNumber,
      patientName,
      facility,
      slot,
      status: "confirmed",
      bookedAt: new Date().toISOString(),
      queuePosition: mockQueueState.totalInQueue,
      estimatedWaitMins: mockQueueState.estimatedWaitMins,
    };

    // Emit real-time queue update to all connected clients (waiting room
    // displays, patient app, ASHA dashboard, etc.)
    const io = req.app.get("io");
    if (io && typeof io.emit === "function") {
      io.emit("queue:update", {
        ...buildQueueSnapshot(),
        latestToken: tokenNumber,
      });
    } else {
      console.warn(
        "[queueController.bookAppointment] Socket.io instance not found on app — skipping real-time emit."
      );
    }

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      data: bookingDetails,
    });
  } catch (error) {
    console.error("[queueController.bookAppointment] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to book appointment.",
      data: null,
    });
  }
}

/**
 * tick(io)
 * Called on a 4s interval from server.js to advance the shared demo queue
 * (simulating patients being served) and broadcast the updated snapshot to
 * every connected client. Not an Express handler — takes the Socket.io
 * server instance directly.
 * @param {import('socket.io').Server} io
 */
function tick(io) {
  try {
    // Advance "now serving" whenever there's someone left waiting.
    if (mockQueueState.totalInQueue > 0) {
      mockQueueState.nowServingNumber += 1;
      mockQueueState.totalInQueue -= 1;
      recalcEstimatedWait();
    }

    if (io && typeof io.emit === "function") {
      io.emit("queue:update", buildQueueSnapshot());
    }
  } catch (error) {
    console.error("[queueController.tick] Error:", error);
  }
}

module.exports = {
  getQueue,
  bookAppointment,
  tick,
};
