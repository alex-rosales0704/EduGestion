'use strict';
const r=require('express').Router(),c=require('../controllers/docenteController');
const {requireRole}=require('../middlewares/auth');const {asyncRoute}=require('../middlewares/errors');
r.use(requireRole('DOCENTE'));
r.get('/',asyncRoute(c.inicio));
r.get('/asignaciones',asyncRoute(c.inicio));
r.get('/asignaciones/:id/notas',asyncRoute(c.cuadro));
r.post('/asignaciones/:id/notas',asyncRoute(c.guardar));
module.exports=r;
