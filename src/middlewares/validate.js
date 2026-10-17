'use strict';
const { validationResult } = require('express-validator');
const { AppError } = require('./errors');
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(422, errors.array().map(e => e.msg).join(' ')));
  next();
}
module.exports = { validateRequest };
