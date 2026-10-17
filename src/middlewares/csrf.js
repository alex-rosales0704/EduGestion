'use strict';
const crypto = require('node:crypto');
const { AppError } = require('./errors');
function csrfProtection(req, res, next) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const submitted = req.body?._csrf;
    const expected = req.session.csrfToken;
    if (typeof submitted !== 'string' || submitted.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(submitted), Buffer.from(expected))) {
      return next(new AppError(403, 'Formulario caducado o token de seguridad inválido. Recarga la página.'));
    }
  }
  next();
}
module.exports = { csrfProtection };
