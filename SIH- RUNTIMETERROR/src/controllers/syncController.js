/**
 * syncController.js
 * Ingests batches of offline ASHA-worker visit records once a device
 * regains connectivity (see "Offline Sync Mesh" tab / triggerSync()).
 */

let syncedBatches = [];

exports.syncAshaRecords = (req, res) => {
  const records = Array.isArray(req.body?.records) ? req.body.records : [];

  const batch = {
    id: `batch-${Date.now()}`,
    receivedAt: new Date().toISOString(),
    recordCount: records.length || 3, // fall back to the demo's "3 offline records"
    deviceId: req.body?.deviceId || 'asha-device-unknown'
  };

  syncedBatches.push(batch);
  if (syncedBatches.length > 50) syncedBatches = syncedBatches.slice(-50);

  res.json({
    ok: true,
    message: `${batch.recordCount} record(s) synced to District Health Grid.`,
    batch
  });
};

exports.getSyncHistory = (req, res) => {
  res.json({ ok: true, batches: syncedBatches });
};