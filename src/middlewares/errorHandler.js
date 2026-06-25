/**
 * Async error wrapper – wraps async route handlers to forward errors to next()
 * @param {Function} fn Async route handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Centralized error handling middleware.
 * Must be registered LAST in app.js.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error("[v0] Error:", err.message, err.stack);

  // Zod validation error
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation error.",
      errors: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}.`,
    });
  }

  // Custom app errors with statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Generic 500
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error." : err.message,
  });
}

/**
 * Creates an app-level error with a custom HTTP status code
 */
export function createError(message, statusCode = 500) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
