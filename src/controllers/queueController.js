/**
 * queueController.js
 * Live appointment / token-queue mock state, broadcast over Socket.io.
 */

const FACILITIES = [
  'Sub-Centre, Vadgaon',
  'Primary Health Centre, Karjat',
  'Community Health Centre, Khalapur',
  'District Hospital, Raigad'
];

let queueState = {
  nowServingNumber: 12,
  yourTokenNumber: 19,
  waitMinutes: 21,
  patientsAhead: 7
};

let tokenSeq = 19;

function snapshot() {
  return {
    nowServing: `A-${queueState.nowServingNumber}`,
    yourToken: `A-${queueState.yourTokenNumber}`,
    waitMinutes: queueState.waitMinutes,
    patientsAhead: Math.max(queueState.yourTokenNumber - queueState.nowServingNumber - 1, 0)
  };
}

// Called on a timer from server.js so every connected client sees the
// same slowly-advancing queue.
function tick(io) {
  if (queueState.waitMinutes > 2) {
    queueState.waitMinutes -= 1;
  }
  if (queueState.nowServingNumber < queueState.yourTokenNumber - 1 && Math.random() > 0.5) {
    queueState.nowServingNumber += 1;
  }
  if (io) io.emit('queue:update', snapshot());
}

exports.tick = tick;

exports.getQueue = (req, res) => {
  res.json({ ok: true, queue: snapshot() });
};

exports.bookAppointment = (req, res) => {
  const { facility, slot } = req.body || {};

  tokenSeq += 1;
  queueState.yourTokenNumber = tokenSeq;
  queueState.waitMinutes = 15 + Math.floor(Math.random() * 20);

  const booking = {
    ok: true,
    facility: FACILITIES.includes(facility) ? facility : (facility || FACILITIES[0]),
    slot: slot || 'Next available slot',
    token: `A-${queueState.yourTokenNumber}`,
    queue: snapshot(),
    bookedAt: new Date().toISOString()
  };

  const io = req.app.get('io');
  if (io) io.emit('appointment:book', booking);

  res.json(booking);
};
