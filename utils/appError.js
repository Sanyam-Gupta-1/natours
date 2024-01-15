class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';
    this.operational = true;

    // What is the purpose of below line
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
