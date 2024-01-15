const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError('No document with that id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // console.log(req.body);
    // findOneAndX and findByIdAndX functions support limited validation- means only runs limited validator
    // For ex - in case of findByIdAndUpdate only chnaged property validators run but in case of .save() and .create() all validators runs.
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new AppError('No document with that id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).send({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.getOne = (Model, populateObj) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateObj) query = query.populate(populateObj);
    const document = await query;

    if (!document) {
      return next(new AppError('No document with that id', 404));
    }

    res.status(200).send({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To get all review of particular tour
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }
    if (req.params.userId) {
      filter = { user: req.params.userId };
    }
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const documents = await features.query;
    // const documents = await features.query.explain();

    res.status(200).send({
      status: 'success',
      // requestedAt: req.requestTime,
      results: documents.length,
      data: {
        documents,
      },
    });
  });
