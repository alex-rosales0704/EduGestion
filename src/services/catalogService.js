'use strict';
const { pool, transaction } = require('../config/db');
const repo = require('../repositories/adminRepository');
const { AppError } = require('../middlewares/errors');
const { cicloAbierto, coherenciaSeccion } = require('./rules');
function valuesFrom(d,raw,isEdit) {
 const fields = d.fields.filter(f => !(isEdit && f.createOnly));
 const values={};
 for(const field of fields) {
   const v=raw[field.name];
   if(field.required && (typeof v!=='string'||!v.trim())) throw new AppError(422,`El campo ${field.label} es obligatorio.`);
   if(v!=null && typeof v!=='string') throw new AppError(422,`Formato inválido: ${field.label}.`);
   const s=v?.trim() || null;
   if(s && field.max && s.length>field.max) throw new AppError(422,`El campo ${field.label} excede ${field.max} caracteres.`);
   if(s && field.type==='date' && !/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new AppError(422,`Fecha inválida: ${field.label}.`);
   if(s && field.type==='select' && !/^[1-9]\d*$/.test(s)) throw new AppError(422,`Selecciona ${field.label}.`);
   if(s && field.type==='number' && (!/^\d+(?:\.\d{1,2})?$/.test(s)||Number(s)<field.min||Number(s)>field.max)) throw new AppError(422,`Valor inválido: ${field.label}.`);
   values[field.name]=s;
 }
 const fechaInicio=values.fecha_inicio, fechaFin=values.fecha_fin;
 if(fechaInicio && fechaFin && fechaFin<fechaInicio) throw new AppError(422,'La fecha de fin no puede ser anterior a la fecha de inicio.');
 return values;
}
async function validate(resource,values,conn,old=null) {
 if(resource==='ciclos' && old?.estado==='CERRADO') throw new AppError(409,'No se puede editar un ciclo cerrado.');
 if(['secciones','periodos','asignaciones','matriculas'].includes(resource)) await cicloAbierto(old?.ciclo_id||values.ciclo_id,conn);
 if(['asignaciones','matriculas'].includes(resource)) await coherenciaSeccion(values.seccion_id,values.ciclo_id,conn);
 if(resource==='asignaciones') {
  const [[docente]=[]]=await conn.execute('SELECT d.id FROM docentes d JOIN usuarios u ON u.id=d.usuario_id WHERE d.id=? AND u.activo=1',[values.docente_id]);
  const [[mat]=[]]=await conn.execute('SELECT id FROM asignaturas WHERE id=? AND activa=1',[values.asignatura_id]);
  if(!docente||!mat)throw new AppError(422,'El docente o la asignatura no están activos.');
 }
 if(resource==='matriculas') {
  const [[est]=[]]=await conn.execute('SELECT e.id FROM estudiantes e JOIN usuarios u ON u.id=e.usuario_id WHERE e.id=? AND u.activo=1',[values.estudiante_id]);
  if(!est)throw new AppError(422,'El estudiante no está activo.');
 }
 if(resource==='periodos') {
   if(old?.estado==='CERRADO') throw new AppError(409,'No se puede modificar un periodo cerrado.');
   const [sumaRows]=await conn.execute('SELECT COALESCE(SUM(ponderacion),0) AS total FROM periodos_evaluacion WHERE ciclo_id=? AND id<>?',[old?.ciclo_id||values.ciclo_id,old?.id||0]);
   if(Number(sumaRows[0].total)+Number(values.ponderacion)>100.00001) throw new AppError(422,'Las ponderaciones de un ciclo no pueden superar el 100 %.');
 }
}
async function save(resource,id,raw) {
 const d=repo.definition(resource);
 if(id&&!d.editable) throw new AppError(403,'Este registro solo permite alta y desactivación.');
 return transaction(async conn => {
   let old=null;
   if(id) {const [[r]=[]]=await conn.execute(`SELECT * FROM ${d.table} WHERE id=? FOR UPDATE`,[id]);if(!r)throw new AppError(404,'Registro no encontrado.');old=r;}
   const vals=valuesFrom(d,raw,!!id);
   await validate(resource,vals,conn,old);
   const cols=Object.keys(vals);
   if(id) await conn.execute(`UPDATE ${d.table} SET ${cols.map(c=>'`'+c+'`=?').join(',')} WHERE id=?`,[...Object.values(vals),id]);
   else await conn.execute(`INSERT INTO ${d.table} (${cols.map(c=>'`'+c+'`').join(',')}) VALUES (${cols.map(()=>'?').join(',')})`,Object.values(vals));
 });
}
async function changeStatus(resource,id,kind) {
 const d=repo.definition(resource);
 const statement = kind==='close' && d.close ? ['estado','CERRADO'] : kind==='deactivate' && d.deactivate ? ['activa',0] : kind==='retire' && d.retire ? ['estado','RETIRADA'] : null;
 if(!statement) throw new AppError(403,'Operación no admitida para este módulo.');
 return transaction(async conn => {
  const [[r]=[]]=await conn.execute(`SELECT * FROM ${d.table} WHERE id=? FOR UPDATE`,[id]);
  if(!r)throw new AppError(404,'Registro inexistente.');
  if(resource!=='ciclos' && resource!=='asignaturas') await cicloAbierto(r.ciclo_id,conn);
  if(resource==='ciclos' && kind==='close') {
    const [p]=await conn.execute('SELECT COUNT(*) AS cuenta,COALESCE(SUM(ponderacion),0) AS total FROM periodos_evaluacion WHERE ciclo_id=?',[id]);
    if(p[0].cuenta > 0 && Math.abs(Number(p[0].total)-100)>0.00001) throw new AppError(422,'Para cerrar un ciclo, las ponderaciones deben sumar 100 %.');
  }
  if(resource==='periodos' && kind==='close') { const [p]=await conn.execute('SELECT COALESCE(SUM(ponderacion),0) AS peso FROM periodos_evaluacion WHERE ciclo_id=?',[r.ciclo_id]); if(Math.abs(Number(p[0].peso)-100)>0.00001)throw new AppError(422,'Para cerrar periodos, el esquema debe sumar 100 %.'); }
  await conn.execute(`UPDATE ${d.table} SET ${statement[0]}=? WHERE id=?`,[statement[1],id]);
 });
}
module.exports = {save,changeStatus};
