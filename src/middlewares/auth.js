'use strict';
const { pool } = require('../config/db');
const { AppError } = require('./errors');
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.session.user) return res.redirect('/login');
      // Comprobación contra BD por petición: una cuenta desactivada pierde el acceso, incluso con sesión abierta.
      const [[u] = []] = await pool.execute('SELECT u.activo,r.nombre AS rol FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.id=?',[req.session.user.id]);
      if (!u?.activo) {
        return req.session.destroy(() => res.clearCookie('edugestion.sid').status(403).render('errors/error', {title:'Cuenta desactivada',message:'Tu sesión ya no tiene autorización.'}));
      }
      if (!roles.includes(u.rol)) return next(new AppError(403, 'No tienes permiso para realizar esta operación.'));
      next();
    } catch(err) {next(err);}
  };
}
function loadUserContext(req, res, next) {
  res.locals.usuario = req.session.user || null;
  res.locals.mensaje = req.session.flash || null;
  delete req.session.flash;
  next();
}
module.exports = { requireAuth, requireRole, loadUserContext };
