'use strict';
const r=require('express').Router();
const c=require('../controllers/perfilController');
const {requireRole}=require('../middlewares/auth');
const {asyncRoute}=require('../middlewares/errors');
r.use(requireRole('ADMINISTRADOR','DOCENTE','ESTUDIANTE'));
r.get('/',asyncRoute(c.ver));
r.post('/clave',asyncRoute(c.cambiarClave));
module.exports=r;
