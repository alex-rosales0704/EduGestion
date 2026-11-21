'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {pool} = require('../config/db');
const {AppError} = require('../middlewares/errors');
const STORAGE = path.join(__dirname, '..','..','storage','uploads');
const MAX_FILE = 5 * 1024 * 1024;
const TYPES = {
 pdf: {mime:'application/pdf', match:b=>b.subarray(0,5).toString('ascii')==='%PDF-'},
 png: {mime:'image/png', match:b=>b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))},
 jpg: {mime:'image/jpeg', match:b=>b.length>4 && b[0]===0xff && b[1]===0xd8 && b[2]===0xff && b[b.length-2]===0xff && b[b.length-1]===0xd9}
};
function validateUpload(file){
 if(!file?.buffer?.length) throw new AppError(422,'Selecciona un archivo PDF, JPG o PNG.');
 if(file.buffer.length > MAX_FILE) throw new AppError(413,'El archivo supera los 5 MB permitidos.');
 const ext = path.extname(file.originalname || '').toLowerCase().replace('.','');
 const key=ext==='jpeg'?'jpg':ext;
 if(!TYPES[key] || !TYPES[key].match(file.buffer)) throw new AppError(422,'Tipo de archivo no válido. Usa PDF, JPG o PNG.');
 const basename=path.basename(String(file.originalname).replace(/\\/g,'/')).slice(0,180);
 if(!basename || /[\r\n\x00-\x1f]/.test(basename))throw new AppError(422,'Nombre de archivo inválido.');
 return {extension:key,original:basename,mime:TYPES[key].mime};
}
function idNumber(v){const num=Number(v);if(!Number.isSafeInteger(num)||num<=0)throw new AppError(422,'Identificador inválido.');return num;}
async function listForAdmin(){const [rows]=await pool.query(`SELECT a.*,CONCAT(e.nombres,' ',e.apellidos) AS estudiante,e.carnet,u.correo AS autor
 FROM documentos a JOIN estudiantes e ON e.id=a.estudiante_id JOIN usuarios u ON u.id=a.usuario_id
 WHERE a.eliminado_at IS NULL ORDER BY a.id DESC`);return rows;}
async function listForStudent(userId){const [rows]=await pool.execute(`SELECT a.*,e.carnet FROM documentos a
 JOIN estudiantes e ON e.id=a.estudiante_id WHERE e.usuario_id=? AND a.eliminado_at IS NULL ORDER BY a.id DESC`,[userId]);return rows;}
async function store({userId,studentId,descripcion,file}){
 const student=idNumber(studentId),valid=validateUpload(file);
 if(typeof descripcion!=='string'||descripcion.trim().length<3||descripcion.trim().length>200)throw new AppError(422,'La descripción debe tener entre 3 y 200 caracteres.');
 const [[row]=[]]=await pool.execute('SELECT id FROM estudiantes WHERE id=?',[student]);
 if(!row)throw new AppError(404,'El estudiante seleccionado no existe.');
 await fs.mkdir(STORAGE,{recursive:true,mode:0o700});
 const saved=crypto.randomUUID()+'.'+valid.extension;
 await fs.writeFile(path.join(STORAGE,saved),file.buffer,{flag:'wx',mode:0o600});
 try{
  await pool.execute(`INSERT INTO documentos(estudiante_id,usuario_id,nombre_original,nombre_almacenado,tipo_mime,tamano_bytes,descripcion)
 VALUES (?,?,?,?,?,?,?)`,[student,userId,valid.original,saved,valid.mime,file.buffer.length,descripcion.trim()]);
 }catch(err){await fs.unlink(path.join(STORAGE,saved)).catch(()=>{});throw err;}
}
async function get(id,user){
 const [[row]=[]]=await pool.execute(`SELECT a.*,e.usuario_id AS propietario
 FROM documentos a JOIN estudiantes e ON e.id=a.estudiante_id WHERE a.id=? AND a.eliminado_at IS NULL`,[idNumber(id)]);
 if(!row)throw new AppError(404,'Documento no encontrado.');
 if(user.rol!=='ADMINISTRADOR' && !(user.rol==='ESTUDIANTE' && Number(row.propietario)===Number(user.id)))
   throw new AppError(403,'No tienes permiso para consultar este documento.');
 return row;
}
async function download(res,row){
 const filepath=path.join(STORAGE,path.basename(row.nombre_almacenado));
 await fs.access(filepath);
 res.type(row.tipo_mime);
 res.set('X-Content-Type-Options','nosniff');
 res.set('Cache-Control','private, no-store');
 res.attachment(row.nombre_original);
 res.sendFile(filepath);
}
async function preview(res,row){
 const filepath=path.join(STORAGE,path.basename(row.nombre_almacenado));
 await fs.access(filepath);
 res.type(row.tipo_mime);
 res.set('X-Content-Type-Options','nosniff');
 res.set('Cache-Control','private, no-store');
 res.set('Content-Disposition','inline');
 res.sendFile(filepath);
}
async function remove(id){
 const [result]=await pool.execute('UPDATE documentos SET eliminado_at=NOW() WHERE id=? AND eliminado_at IS NULL',[idNumber(id)]);
 if(!result.affectedRows)throw new AppError(404,'Documento no encontrado.');
}
module.exports={validateUpload,store,get,download,preview,remove,listForAdmin,listForStudent,STORAGE};
