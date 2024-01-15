const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
// const reviewController = require('../controllers/reviewController');
const reviewRouter = require('./reviewRoute');
const bookingRouter = require('./bookingRoute');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

//  POST  /tours/232gdfg322/reviews
//  GET  /tours/2356454/reviews
//  GET  /tours/2356454/reviews/45sdf4d5

// router.post(
//   '/:tourId/reviews',
//   authController.protect,
//   authController.restrictTo('user'),
//   reviewController.createReview,
// );

router.use('/:tourId/reviews', reviewRouter);
router.use('/:tourId/bookings', bookingRouter);

// router.param('id', tourController.checkId);

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(catchAsync(tourController.getMontlyPlan));

router.route('/tour-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

router.param('id', (req, res, next) => {
  // console.log('Id param middleware');
  next();
});

module.exports = router;
