/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoute');
const bookingRouter = require('./routes/bookingRoute');
const viewRouter = require('./routes/viewRoute');
const AppError = require('./utils/appError');
const GlobalErrorHandler = require('./controllers/errorController');

// Start express app
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serving static files
app.use(express.static(`${__dirname}/public`));

// 1) Global Middleware

// Set security HTTP headers
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://js.stripe.com/v3/',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
  'https://js.stripe.com/v3/',
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'https://js.stripe.com/v3/',
  'https://checkout.stripe.com/c/pay/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com', 'https://js.stripe.com/v3/'];
const frameSrcUrls = ['https://js.stripe.com/v3/'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ["'self'", ...frameSrcUrls],
    },
  }),
);

// Development Logging
const enviornment = process.env.NODE_ENV;
if (enviornment === 'development') {
  app.use(morgan('dev'));
}

// Limit rerquests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data Sanitization againt NoSQL query injections such as ("email" : {"$gt": ""}) by removing $ and dot(.)
app.use(mongoSanitize());

// Data sanitization against XSS - means prevent storing malacius Html code by corverting its symbol beacuse it can have some harmful Js attached to it
app.use(xss());

// Prevent parameter pollution which means handles sending same paramter again and again in query string by using last of that same parameter, but allows sending multiple parameters of whitelist fields [refer jonas node js course vid-146]
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression());
// Test middleware
// app.use((req, res, next) => {
// console.log('Hello from the middleware 🤟🤟');
//   next();
// });
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(x);
  next();
});

// 2) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);
app.use('/', viewRouter);

// Error handling
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(GlobalErrorHandler);
module.exports = app;

// Consider another factor while deciding data model to be used(embedded or refernced) :
// "number of realtionship data set have", MEANING - if a data set is realated with too many other data sets than use referencing, for example - Booking data set is related with tour and user data set so used referncing
