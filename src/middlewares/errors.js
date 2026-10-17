'use strict';
class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function asyncRoute(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }
function notFound(req, res) { res.status(404).render('errors/error', { title: 'Página no encontrada', message: 'La dirección solicitada no existe.' }); }
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || (err.code === 'ER_DUP_ENTRY' ? 409 : 500);
  let message = status === 500 ? 'Ocurrió un error interno. Revisa la consola del servidor.' : err.message;
  if (err.code === 'ER_DUP_ENTRY') message = 'Ya existe un registro con uno de esos valores únicos.';
  if (err.code === 'ER_ROW_IS_REFERENCED_2') message = 'No se puede borrar un registro con relaciones históricas.';
  if (process.env.NODE_ENV !== 'production') console.error(err);
  res.status(status).render('errors/error', { title: `Error ${status}`, message });
}
module.exports = { AppError, asyncRoute, notFound, errorHandler };
