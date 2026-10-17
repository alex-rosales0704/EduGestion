'use strict';
const {pool}=require('../config/db');
const repo=require('../repositories/adminRepository');
const catalog=require('../services/catalogService');
const users=require('../services/userService');
const {AppError}=require('../middlewares/errors');
const menu=[['estudiantes','Estudiantes'],['docentes','Docentes'],['ciclos','Ciclos'],['asignaturas','Asignaturas'],['secciones','Secciones'],['periodos','Periodos'],['asignaciones','Asignaciones'],['matriculas','Matrículas']];
function isUser(type){return type==='estudiantes'||type==='docentes';}
function flash(req,message){req.session.flash=message;}
async function dashboard(req,res){
 const [[estudiantes]]=await pool.query('SELECT COUNT(*) total FROM estudiantes');
 const [[docentes]]=await pool.query('SELECT COUNT(*) total FROM docentes');
 const [[secciones]]=await pool.query('SELECT COUNT(*) total FROM secciones');
 const [[ciclos]]=await pool.query("SELECT COUNT(*) total FROM ciclos_lectivos WHERE estado='ABIERTO'");
 const [[asignaturas]]=await pool.query("SELECT COUNT(*) total FROM asignaturas WHERE activa=1");
 const [[matriculas]]=await pool.query("SELECT COUNT(*) total FROM matriculas WHERE estado='ACTIVA'");
 const [recientes]=await pool.query("SELECT e.carnet,CONCAT(e.nombres,' ',e.apellidos) AS nombre,u.activo FROM estudiantes e JOIN usuarios u ON u.id=e.usuario_id ORDER BY e.id DESC LIMIT 5");
 res.render('admin/dashboard',{title:'Panel de administración',stats:{estudiantes:estudiantes.total,docentes:docentes.total,secciones:secciones.total,ciclos:ciclos.total,asignaturas:asignaturas.total,matriculas:matriculas.total},recientes,menu});
}
async function list(req,res){
 const type=req.params.type;
 if(isUser(type)) {
   const d=users.def(type);
   const [rows]=await pool.query(`SELECT t.*,u.correo,u.activo,IF(u.activo,'Activo','Inactivo') AS estado_texto FROM ${d.table} t JOIN usuarios u ON u.id=t.usuario_id ORDER BY t.id DESC`);
   return res.render('admin/users-list',{title:type==='estudiantes'?'Expedientes de estudiantes':'Expedientes docentes',type,rows,code:d.code,menu});
 }
 const d=repo.definition(type),rows=await repo.list(type);
 res.render('admin/list',{title:d.title,type,d,rows,menu});
}
async function form(req,res){
 const type=req.params.type, id=req.params.id?Number(req.params.id):null;
 if(id!==null && (!Number.isSafeInteger(id)||id<1))throw new AppError(422,'Identificador inválido.');
 if(isUser(type)){
   const d=users.def(type);
   let item={};
   if(id){const [[r]=[]]=await pool.execute(`SELECT t.*,u.correo FROM ${d.table} t JOIN usuarios u ON u.id=t.usuario_id WHERE t.id=?`,[id]);if(!r)throw new AppError(404,'Expediente inexistente.');item=r;}
   return res.render('admin/users-form',{title:id?'Editar expediente':'Crear expediente',type,item,code:d.code,fields:d.fields,id,menu});
 }
 const d=repo.definition(type);
 if(id && !d.editable)throw new AppError(403,'Este módulo no permite editar registros creados.');
 const item=id?await repo.one(type,id):{},options=await repo.options();
 res.render('admin/form',{title:id?'Editar '+d.title:'Nuevo - '+d.title,type,d,item,options,id,menu});
}
async function save(req,res){
 const type=req.params.type,id=req.params.id?Number(req.params.id):null;
 if(id!==null && (!Number.isSafeInteger(id)||id<1))throw new AppError(422,'Identificador inválido.');
 if(isUser(type))await users.save(type,id,req.body);
 else await catalog.save(type,id,req.body);
 flash(req,id?'Cambios guardados correctamente.':'Registro creado correctamente.');
 res.redirect(`/admin/${type}`);
}
async function status(req,res){
 const type=req.params.type,id=Number(req.params.id),kind=req.params.kind;
 if(!Number.isSafeInteger(id)||id<=0)throw new AppError(422,'ID inválido.');
 if(isUser(type)){
   if(kind!=='deactivate')throw new AppError(403,'Operación no permitida.');
   await users.deactivate(type,id);
 }else await catalog.changeStatus(type,id,kind);
 flash(req,'Estado actualizado correctamente.');res.redirect(`/admin/${type}`);
}
module.exports={dashboard,list,form,save,status};
