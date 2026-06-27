// Global Express Error Handler Middleware
module.exports = (err, req, res, next) => {
  console.error('[Global Error Middleware]', err.stack || err);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.name || 'ServerError',
    message: err.message || 'An unexpected error occurred on the server.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
