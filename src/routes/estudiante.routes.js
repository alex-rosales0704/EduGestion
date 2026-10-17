'use strict';
const r=require('express').Router(),c=require('../controllers/estudianteController');
const {requireRole}=require('../middlewares/auth');const {asyncRoute}=require('../middlewares/errors');
r.use(requireRole('ESTUDIANTE'));
r.get('/',asyncRoute(c.inicio));
r.get('/calificaciones',asyncRoute(c.inicio));
r.get('/historial',asyncRoute(c.inicio));
r.get('/boleta',asyncRoute(c.boleta));
module.exports=r;
