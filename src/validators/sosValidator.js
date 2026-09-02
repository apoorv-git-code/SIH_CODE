const sosCooldown = new Map();

function sosGuard(req, res, next) {
  const key = req.ip;
  const last = sosCooldown.get(key) || 0;
  if (Date.now() - last < 10000) {
    return res.status(429).json({ ok: false, error: 'SOS already dispatched — please wait' });
  }
  sosCooldown.set(key, Date.now());
  next();
}

module.exports = { sosGuard };