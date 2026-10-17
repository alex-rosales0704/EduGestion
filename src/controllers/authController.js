'use strict';
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { AppError } = require('../middlewares/errors');
function loginForm(req,res) { res.render('auth/login',{title:'Iniciar sesión', error:null}); }
async function login(req,res) {
  const correo = req.body.correo?.trim().toLowerCase();
  const password = req.body.password;
  const [[u] = []] = await pool.execute(`SELECT u.id, u.correo, u.password_hash, u.activo, r.nombre AS rol
    FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.correo=?`, [correo]);
  const correcto = u?.activo && await bcrypt.compare(password, u.password_hash);
  if (!correcto) return res.status(401).render('auth/login',{title:'Iniciar sesión',error:'Correo o contraseña incorrectos.'});
  await pool.execute('UPDATE usuarios SET ultimo_acceso=NOW() WHERE id=?',[u.id]);
  req.session.regenerate(err => {
    if (err) return res.status(500).render('auth/login',{title:'Iniciar sesión',error:'No se pudo crear una sesión.'});
    req.session.user = {id:u.id, correo:u.correo, rol:u.rol};
    const destino = {ADMINISTRADOR:'/admin',DOCENTE:'/docente',ESTUDIANTE:'/estudiante'}[u.rol];
    if (!destino) return res.status(403).render('auth/login',{title:'Iniciar sesión',error:'Rol de cuenta desconocido.'});
    req.session.save(e => e ? res.status(500).render('auth/login',{title:'Iniciar sesión',error:'No se pudo guardar sesión.'}) : res.redirect(destino));
  });
}
function logout(req,res,next) { req.session.destroy(e => e ? next(e) : res.clearCookie('edugestion.sid').redirect('/login')); }
function home(req,res) {const rol=req.session.user?.rol;res.redirect(({ADMINISTRADOR:'/admin',DOCENTE:'/docente',ESTUDIANTE:'/estudiante'})[rol] || '/login');}
module.exports = { loginForm,login,logout,home };
