'use strict';
const r=require('express').Router();
const {requireRole}=require('../middlewares/auth');
const {asyncRoute}=require('../middlewares/errors');
r.get('/:id/ver',requireRole('ADMINISTRADOR','ESTUDIANTE'),asyncRoute(require('../controllers/documentController').preview));
r.get('/:id/descargar',requireRole('ADMINISTRADOR','ESTUDIANTE'),asyncRoute(require('../controllers/documentController').download));
module.exports=r;
