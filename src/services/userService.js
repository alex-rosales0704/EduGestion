'use strict';
const bcrypt=require('bcrypt');
const { transaction }=require('../config/db');
const { AppError }=require('../middlewares/errors');
const entities={estudiantes:{table:'estudiantes',rol:3,code:'carnet',fields:['nombres','apellidos','fecha_nacimiento','telefono','direccion','fecha_ingreso']},docentes:{table:'docentes',rol:2,code:'codigo_docente',fields:['nombres','apellidos','especialidad','telefono']}};
function def(type){const d=entities[type];if(!d)throw new AppError(404,'Expediente inexistente.');return d;}
function normalize(type,raw,isEdit=false){
 const d=def(type), values={};
 for(const f of ['correo',d.code,...d.fields]) {
   const v=raw[f]; if(v!=null&&typeof v!=='string')throw new AppError(422,`Valor incorrecto: ${f}`);
   values[f]=v?.trim()||null;
 }
 for(const f of ['correo',d.code,'nombres','apellidos'])if(!values[f])throw new AppError(422,`El campo ${f} es obligatorio.`);
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.correo) || values.correo.length>150)throw new AppError(422,'Correo electrónico no válido.');
 values.correo=values.correo.toLowerCase();
 if(values.nombres.length>90||values.apellidos.length>90||values[d.code].length>30)throw new AppError(422,'Nombre, apellido o código excede la longitud permitida.');
 if(values.fecha_nacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(values.fecha_nacimiento))throw new AppError(422,'Fecha de nacimiento inválida.');
 if(values.fecha_ingreso && !/^\d{4}-\d{2}-\d{2}$/.test(values.fecha_ingreso))throw new AppError(422,'Fecha de ingreso inválida.');
 if(!isEdit && (typeof raw.password !== 'string'||raw.password.length<8))throw new AppError(422,'Contraseña inicial: mínimo 8 caracteres.');
 if(raw.password && (typeof raw.password!=='string'||raw.password.length<8))throw new AppError(422,'Contraseña nueva: mínimo 8 caracteres.');
 return {values,password:raw.password};
}
async function save(type,id,raw){
 const d=def(type),{values,password}=normalize(type,raw,!!id);
 return transaction(async conn => {
   let userId;
   if(id){
     const [[row]=[]]=await conn.execute(`SELECT usuario_id FROM ${d.table} WHERE id=? FOR UPDATE`,[id]);
     if(!row)throw new AppError(404,'Expediente no encontrado.');userId=row.usuario_id;
     await conn.execute('UPDATE usuarios SET correo=? WHERE id=?',[values.correo,userId]);
     if(password)await conn.execute('UPDATE usuarios SET password_hash=? WHERE id=?',[await bcrypt.hash(password,12),userId]);
   } else {
     const [u]=await conn.execute('INSERT INTO usuarios(rol_id,correo,password_hash) VALUES (?,?,?)',[d.rol,values.correo,await bcrypt.hash(password,12)]);
     userId=u.insertId;
   }
   const cols=[d.code,...d.fields], vals=cols.map(x=>values[x]);
   if(id) await conn.execute(`UPDATE ${d.table} SET ${cols.map(c=>'`'+c+'`=?').join(',')} WHERE id=?`,[...vals,id]);
   else await conn.execute(`INSERT INTO ${d.table}(usuario_id,${cols.map(c=>'`'+c+'`').join(',')}) VALUES (${cols.map(()=>'?').join(',')})`,[userId,...vals]);
 });
}
async function deactivate(type,id){
 const d=def(type);
 return transaction(async conn=>{
   const [[row]=[]]=await conn.execute(`SELECT usuario_id FROM ${d.table} WHERE id=? FOR UPDATE`,[id]);
   if(!row)throw new AppError(404,'Expediente no encontrado.');
   await conn.execute('UPDATE usuarios SET activo=0 WHERE id=?',[row.usuario_id]);
 });
}
module.exports={entities,def,save,deactivate};
