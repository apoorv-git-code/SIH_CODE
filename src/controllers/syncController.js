/**
 * src/controllers/syncController.js
 * Gram Arogya Connect (SIH 2026, PS #26133)
 *
 * Handles bulk synchronization of offline-collected visit records from
 * ASHA (Accredited Social Health Activist) workers operating in
 * zero-network / low-connectivity rural zones. Records are queued locally
 * on the ASHA worker's device and pushed in a single batch once
 * connectivity is restored.
 *
 * Wired via src/routes/api.js:
 *   POST /api/v1/sync/asha -> syncAshaRecords
 *   GET  /api/v1/sync/asha -> getSyncHistory
 */

// ---------------------------------------------------------------------------
// Mock in-memory sync log (replace with durable DB writes / message queue)
// ---------------------------------------------------------------------------
const mockSyncLog = []; // flat list of individually processed records
const mockSyncBatches = []; // one summary entry per batch upload

/**
 * Utility: basic shape validation for a single visit record.
 * @param {object} record
 * @returns {boolean}
 */
function isValidVisitRecord(record) {
  return (
    record &&
    typeof record === "object" &&
    typeof record.patientName === "string" &&
    record.patientName.trim().length > 0 &&
    typeof record.visitDate === "string"
  );
}

/**
 * POST /api/v1/sync/asha
 * Accepts a batch of offline-collected visit records from an ASHA worker's
 * device and simulates server-side ingestion/processing.
 * Expects: { deviceId, records: [...] } in req.body
 */
async function syncAshaRecords(req, res) {
  try {
    const { deviceId, records } = req.body;

    if (!deviceId || typeof deviceId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid 'deviceId' field.",
        data: null,
      });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "'records' must be a non-empty array of visit records.",
        data: null,
      });
    }

    const validRecords = [];
    const rejectedRecords = [];

    records.forEach((record, index) => {
      if (isValidVisitRecord(record)) {
        validRecords.push({
          ...record,
          // Server-assigned sync metadata
          syncId: `SYNC-${Date.now()}-${index}`,
          receivedAt: new Date().toISOString(),
          sourceDeviceId: deviceId,
        });
      } else {
        rejectedRecords.push({
          index,
          reason: "Missing required fields (patientName, visitDate).",
        });
      }
    });

    // Simulate batch processing / persistence latency
    await new Promise((resolve) => setTimeout(resolve, 150));

    mockSyncLog.push(...validRecords);

    const syncTimestamp = new Date().toISOString();

    const batchSummary = {
      batchId: `BATCH-${Date.now()}`,
      deviceId,
      syncTimestamp,
      recordsReceived: records.length,
      recordsProcessed: validRecords.length,
      recordsRejected: rejectedRecords.length,
    };
    mockSyncBatches.push(batchSummary);

    return res.status(200).json({
      success: true,
      message: `Batch sync completed. ${validRecords.length} of ${records.length} record(s) processed.`,
      data: {
        ...batchSummary,
        rejectedDetails: rejectedRecords,
      },
    });
  } catch (error) {
    console.error("[syncController.syncAshaRecords] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process ASHA batch sync.",
      data: null,
    });
  }
}

/**
 * GET /api/v1/sync/asha
 * Returns a history of past batch syncs (most recent first), optionally
 * filtered by deviceId via ?deviceId=... query param.
 */
async function getSyncHistory(req, res) {
  try {
    const { deviceId } = req.query;

    let history = [...mockSyncBatches].reverse();
    if (deviceId) {
      history = history.filter((batch) => batch.deviceId === deviceId);
    }

    return res.status(200).json({
      success: true,
      message: "Sync history retrieved successfully.",
      data: {
        totalBatches: history.length,
        totalRecordsSynced: mockSyncLog.length,
        batches: history,
      },
    });
  } catch (error) {
    console.error("[syncController.getSyncHistory] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve sync history.",
      data: null,
    });
  }
}

module.exports = {
  syncAshaRecords,
  getSyncHistory,
};
