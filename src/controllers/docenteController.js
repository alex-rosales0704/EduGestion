'use strict';
const notas=require('../services/notaService');
const {AppError}=require('../middlewares/errors');
async function inicio(req,res){const asignaciones=await notas.listDocente(req.session.user.id);res.render('docente/dashboard',{title:'Mi panel docente',asignaciones});}
async function cuadro(req,res){const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)throw new AppError(422,'Asignación inválida.');const datos=await notas.cuadroNotas(req.session.user.id,id);res.render('docente/notas',{title:'Carga de calificaciones',...datos});}
async function guardar(req,res){const id=Number(req.params.id),periodoId=Number(req.body.periodo_id);if(!Number.isSafeInteger(id)||!Number.isSafeInteger(periodoId))throw new AppError(422,'Identificadores inválidos.');await notas.guardar(req.session.user.id,id,periodoId,req.body.notas);req.session.flash='Calificaciones guardadas y listas para consulta.';res.redirect(`/docente/asignaciones/${id}/notas`);}
module.exports={inicio,cuadro,guardar};
