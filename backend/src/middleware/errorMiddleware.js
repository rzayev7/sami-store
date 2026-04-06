const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return;
  }

  const fromErr = err?.statusCode ?? err?.status;
  const statusCode =
    Number.isInteger(fromErr) && fromErr >= 400 && fromErr < 600
      ? fromErr
      : 500;

  const message =
    (typeof err?.message === "string" && err.message) ||
    (err && String(err)) ||
    "Server error";

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { errorHandler };
