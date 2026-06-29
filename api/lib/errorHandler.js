module.exports = (err, req, res) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] ${status}: ${message}`, err);

  res.status(status).json({
    success: false,
    error: status === 500 ? "Internal Server Error" : err.error || "Error",
    message: status === 500 ? "An unexpected error occurred" : message,
  });
};
