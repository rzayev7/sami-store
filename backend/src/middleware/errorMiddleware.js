const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return;
  }

  const fromErr = err?.statusCode ?? err?.status;
  const statusCode =
    Number.isInteger(fromErr) && fromErr >= 400 && fromErr < 600
      ? fromErr
      : 500;

  const rawMessage =
    (typeof err?.message === "string" && err.message) ||
    (err && String(err)) ||
    "Server error";

  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    message: isProduction && statusCode === 500 ? "Internal server error" : rawMessage,
    stack: isProduction ? null : err.stack,
  });
};

module.exports = { errorHandler };
