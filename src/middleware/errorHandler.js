function notFound(req, res) {
  res.status(404).json({ ok: false, error: 'Not found' });
}

function errorHandler(err, req, res, next) {
  console.error('[error]', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    ok: false,
    error: isProd ? 'Internal server error' : err.message
  });
}

module.exports = { notFound, errorHandler };