const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Joi validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
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
      error: "Not Found",
      message: "The requested resource was not found",
    });
  }

  if (err.code === "23505") {
    // Unique constraint violation
    return res.status(409).json({
      error: "Conflict",
      message: "A record with this value already exists",
    });
  }

  if (err.code === "23503") {
    // Foreign key constraint violation
    return res.status(400).json({
      error: "Bad Request",
      message: "Invalid reference: the referenced resource does not exist",
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: err.name || "Error",
    message,
  });
};

module.exports = errorHandler;
