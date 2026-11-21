'use strict';
const docs=require('../services/documentService');
const {pool}=require('../config/db');
const {AppError}=require('../middlewares/errors');
async function listAdmin(req,res){
 const [estudiantes]=await pool.query('SELECT id,CONCAT(carnet," - ",nombres," ",apellidos) AS label FROM estudiantes ORDER BY apellidos,nombres');
 res.render('admin/documentos',{title:'Documentos académicos',documentos:await docs.listForAdmin(),estudiantes});
}
async function upload(req,res){
 await docs.store({userId:req.session.user.id,studentId:req.body.estudiante_id,descripcion:req.body.descripcion,file:req.uploadedFile});
 req.session.flash='Documento adjuntado correctamente.';res.redirect('/admin/documentos');
}
async function remove(req,res){await docs.remove(req.params.id);req.session.flash='Documento retirado del listado.';res.redirect('/admin/documentos');}
async function student(req,res){res.render('estudiante/documentos',{title:'Mis documentos',documentos:await docs.listForStudent(req.session.user.id)});}
async function preview(req,res){const row=await docs.get(req.params.id,req.session.user);await docs.preview(res,row);}
async function download(req,res){const row=await docs.get(req.params.id,req.session.user);await docs.download(res,row);}
module.exports={listAdmin,upload,remove,student,download,preview};
