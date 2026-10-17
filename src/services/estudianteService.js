'use strict';
const {pool}=require('../config/db');
const {AppError}=require('../middlewares/errors');
const {EsquemaEvaluacion}=require('./gradeService');
async function historial(userId) {
 const [[est]=[]]=await pool.execute('SELECT id,carnet,nombres,apellidos FROM estudiantes WHERE usuario_id=?',[userId]);
 if(!est)throw new AppError(404,'El estudiante no tiene expediente asociado.');
 const [matriculas]=await pool.execute(`SELECT m.id,m.ciclo_id,m.seccion_id,c.nombre AS ciclo,c.estado AS estado_ciclo,s.nombre AS seccion
 FROM matriculas m JOIN ciclos_lectivos c ON c.id=m.ciclo_id JOIN secciones s ON s.id=m.seccion_id
 WHERE m.estudiante_id=? ORDER BY c.id DESC`,[est.id]);
 const resultado=[];
 for(const matricula of matriculas){
  const [periodos]=await pool.execute('SELECT id,nombre,ponderacion FROM periodos_evaluacion WHERE ciclo_id=? ORDER BY id',[matricula.ciclo_id]);
  const [asignaciones]=await pool.execute(`SELECT a.id,a.asignatura_id,a.activa,s.nombre AS asignatura,s.codigo
    FROM asignaciones_docentes a JOIN asignaturas s ON s.id=a.asignatura_id
    WHERE a.seccion_id=? AND a.ciclo_id=? ORDER BY s.nombre`,[matricula.seccion_id,matricula.ciclo_id]);
  const materias=[];
  for(const asignacion of asignaciones){
   const [notas]=await pool.execute('SELECT periodo_id,nota FROM calificaciones WHERE matricula_id=? AND asignacion_id=?',[matricula.id,asignacion.id]);
   const calculo=new EsquemaEvaluacion(periodos).calcular(notas);
   materias.push({...asignacion,periodos:periodos.map(p=>({...p,nota:notas.find(n=>n.periodo_id===p.id)?.nota ?? null})),calculo});
  }
  resultado.push({...matricula,materias});
 }
 return {estudiante:est,historial:resultado};
}
module.exports={historial};
