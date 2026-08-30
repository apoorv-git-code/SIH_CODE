/**
 * sosController.js
 * Mock 108 emergency ambulance dispatch trigger.
 */

exports.dispatch = (req, res) => {
  const { patientName, location } = req.body || {};

  const dispatch = {
    ok: true,
    unit: 'MH-06-EA-108',
    etaMinutes: 11,
    hospitalBed: '#4 (Reserved)',
    hospital: 'Karjat Rural Hospital',
    patientName: patientName || 'Unknown Patient',
    location: location || 'Vadgaon Sub-Centre Area',
    dispatchedAt: new Date().toISOString()
  };

  res.json(dispatch);
};
