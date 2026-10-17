'use strict';
const bcrypt=require('bcrypt');
const {pool}=require('../config/db');
const {AppError}=require('../middlewares/errors');
async function ver(req,res){
  const [[u]]=await pool.execute(`SELECT u.correo, r.nombre AS rol, u.created_at,u.ultimo_acceso,u.password_hash
    FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.id=?`,[req.session.user.id]);
  if(!u)throw new AppError(404,'No existe el usuario.');
  res.render('perfil',{title:'Mi cuenta',cuenta:u});
}
async function cambiarClave(req,res){
  const antigua=String(req.body.anterior||''),nueva=String(req.body.nueva||'');
  if(nueva.length<8 || nueva.length>72)throw new AppError(422,'La nueva contraseña debe tener entre 8 y 72 caracteres.');
  const [[u]]=await pool.execute('SELECT password_hash FROM usuarios WHERE id=?',[req.session.user.id]);
  if(!u || !await bcrypt.compare(antigua,u.password_hash))throw new AppError(422,'La contraseña actual no coincide.');
  await pool.execute('UPDATE usuarios SET password_hash=? WHERE id=?',[await bcrypt.hash(nueva,12),req.session.user.id]);
  req.session.flash='Contraseña actualizada correctamente.';res.redirect('/perfil');
}
module.exports={ver,cambiarClave};
