const AppError = require('../utils/appError');

const sendErrorDev = (res, req, err) => {
  if (req.originalUrl.startsWith('/api')) {
    // 1) API
    return res.status(err.statusCode).send({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // 2) RENDERED WEBSITE
  console.log(err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (res, req, err) => {
  if (req.originalUrl.startsWith('/api')) {
    console.error('ERROR 💥💥', err);
    // 1) API
    // 1A) Operational trusted error : send message to the client
    if (err.operational) {
      return res.status(err.statusCode).send({
        status: err.status,
        message: err.message,
      });
    }
    // 1B) Programming or other unknown error : don't leak error details
    res.status(500).send({
      status: 'error',
      message: 'Something went wrong!!',
    });
  }
  // 2) RENDERED WEBSITE
  console.error('ERROR 💥💥', err);
  // 2A) Operational trusted error : send message to the client
  if (err.operational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  // 2B) Programming or other unknown error : don't leak error details
  return res.status(500).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later',
  });
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDupliacteFieldsDB = (err) => {
  const value = Object.values(err.keyValue)[0];
  // console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidateError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpireError = () => new AppError('Your token has expired! Please login again.', 401);

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  // console.log(err);
  // console.log(err.name);
  // console.log(err.message);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(res, req, err);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    // error.name is not avaliable in error as it is coming from constructor function of prototype of err
    if (err.name === 'CastError') error = handleCastErrorDB(error);

    if (err.code === 11000) error = handleDupliacteFieldsDB(error);

    if (err.name === 'ValidationError') error = handleValidateError(error);

    if (err.name === 'JsonWebTokenError') error = handleJWTError();

    if (err.name === 'TokenExpiredError') error = handleJWTExpireError();
    sendErrorProd(res, req, error);
  }
};
