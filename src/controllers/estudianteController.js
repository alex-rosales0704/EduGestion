'use strict';
const service=require('../services/estudianteService');
const {boletaEstudiante}=require('../services/reportService');
async function inicio(req,res){const datos=await service.historial(req.session.user.id);res.render('estudiante/calificaciones',{title:'Mis calificaciones',...datos});}
async function boleta(req,res){const datos=await service.historial(req.session.user.id);boletaEstudiante(res,datos);}
module.exports={inicio,boleta};
