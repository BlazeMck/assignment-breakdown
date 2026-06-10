/**
 * Global Error Handler
 * Normalizes database and validation errors into consistent JSON responses
 */
const errorHandler = (err, req, res, next) => {
  // If headers have already been sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error("Error:", err);
  }

  // Joi validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      details: err.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  // Supabase/database error
  if (err.code === "PGRST116") {
    return res.status(404).json({
      success: false,
      error: "Not Found",
      message: "The requested resource was not found",
    });
  }

  if (err.code === "23505") {
    // Unique constraint violation
    return res.status(409).json({
      success: false,
      error: "Conflict",
      message: "A record with this value already exists",
    });
  }

  if (err.code === "23503") {
    // Foreign key constraint violation
    return res.status(400).json({
      success: false,
      error: "Bad Request",
      message: "Invalid reference: the referenced resource does not exist",
    });
  }

  if (err.code === "22P02") {
    // Invalid input format (e.g. bad UUID)
    return res.status(400).json({
      success: false,
      error: "Bad Request",
      message: "Invalid input format: check your IDs and data types",
    });
  }

  // Default error
  const statusCode = err.status || err.statusCode || 500;

  // Don't leak internal error messages in production for 500 errors
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    statusCode === 500 && isProduction
      ? "Internal Server Error"
      : err.message || "Internal Server Error";
  const errorType =
    statusCode === 500 && isProduction
      ? "Internal Server Error"
      : statusCode >= 400 && statusCode < 500 && err.message
        ? err.message
        : err.name || "Error";

  res.status(statusCode).json({
    success: false,
    error: errorType,
    message,
  });
};

module.exports = errorHandler;
