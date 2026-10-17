'use strict';
const {pool,transaction}=require('../config/db');
const {AppError}=require('../middlewares/errors');
const {cicloAbierto}=require('./rules');
const {notaValida}=require('./gradeService');
async function assignedTo(docenteUsuarioId,asignacionId,conn=pool){
 const [[row]=[]]=await conn.execute(`SELECT a.*,s.nombre AS seccion_nombre,m.nombre AS asignatura_nombre,c.nombre AS ciclo_nombre
   FROM asignaciones_docentes a JOIN docentes d ON d.id=a.docente_id JOIN secciones s ON s.id=a.seccion_id
   JOIN asignaturas m ON m.id=a.asignatura_id JOIN ciclos_lectivos c ON c.id=a.ciclo_id
   WHERE a.id=? AND d.usuario_id=? AND a.activa=1`,[asignacionId,docenteUsuarioId]);
 if(!row)throw new AppError(403,'La asignación no pertenece al docente o está inactiva.');
 return row;
}
async function listDocente(userId){
 const [rows]=await pool.execute(`SELECT a.id,s.nombre AS seccion,m.nombre AS asignatura,c.nombre AS ciclo,c.estado AS estado_ciclo
 FROM asignaciones_docentes a JOIN docentes d ON d.id=a.docente_id JOIN secciones s ON s.id=a.seccion_id
 JOIN asignaturas m ON m.id=a.asignatura_id JOIN ciclos_lectivos c ON c.id=a.ciclo_id
 WHERE d.usuario_id=? AND a.activa=1 ORDER BY c.id DESC,s.nombre,m.nombre`,[userId]);return rows;
}
async function cuadroNotas(userId,id){
 const asignacion=await assignedTo(userId,id);
 const [periodos]=await pool.execute('SELECT id,nombre,ponderacion,estado FROM periodos_evaluacion WHERE ciclo_id=? ORDER BY id',[asignacion.ciclo_id]);
 const [alumnos]=await pool.execute(`SELECT m.id AS matricula_id,CONCAT(e.nombres,' ',e.apellidos) AS estudiante,e.carnet
 FROM matriculas m JOIN estudiantes e ON e.id=m.estudiante_id
 WHERE m.seccion_id=? AND m.ciclo_id=? AND m.estado='ACTIVA' ORDER BY e.apellidos`,[asignacion.seccion_id,asignacion.ciclo_id]);
 const [notas]=await pool.execute('SELECT matricula_id,periodo_id,nota FROM calificaciones WHERE asignacion_id=?',[id]);
 const [[ciclo]]=await pool.execute('SELECT estado FROM ciclos_lectivos WHERE id=?',[asignacion.ciclo_id]);
 const mapa={};for(const n of notas)mapa[`${n.matricula_id}:${n.periodo_id}`]=n.nota;
 return {asignacion,periodos,alumnos,mapa,cicloCerrado:ciclo.estado==='CERRADO'};
}
async function guardar(userId,asignacionId,periodoId,notas){
 if(typeof notas!=='object'||!notas||Array.isArray(notas))throw new AppError(422,'Formulario de calificaciones inválido.');
 return transaction(async conn=>{
   const a=await assignedTo(userId,asignacionId,conn);
   await cicloAbierto(a.ciclo_id,conn);
   const [[periodo]=[]]=await conn.execute('SELECT id,estado FROM periodos_evaluacion WHERE id=? AND ciclo_id=? FOR UPDATE',[periodoId,a.ciclo_id]);
   if(!periodo||periodo.estado!=='ABIERTO')throw new AppError(409,'El periodo no existe o se encuentra cerrado.');
   for(const [matriculaId,nota] of Object.entries(notas)) {
     if(nota==='')continue;
     if(!/^[1-9]\d*$/.test(matriculaId)||!notaValida(nota))throw new AppError(422,'Hay una calificación inválida (rango permitido: 0.00 a 10.00).');
     const [[m]=[]]=await conn.execute('SELECT id FROM matriculas WHERE id=? AND ciclo_id=? AND seccion_id=? AND estado=?',[matriculaId,a.ciclo_id,a.seccion_id,'ACTIVA']);
     if(!m)throw new AppError(403,'La matrícula no pertenece a la sección autorizada.');
     await conn.execute(`INSERT INTO calificaciones(matricula_id,asignacion_id,periodo_id,nota) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE nota=VALUES(nota),updated_at=CURRENT_TIMESTAMP`,[matriculaId,asignacionId,periodoId,Number(nota)]);
   }
 });
}
module.exports={assignedTo,listDocente,cuadroNotas,guardar};
