'use strict';
const {pool}=require('../config/db');
const {AppError}=require('../middlewares/errors');
function cicloFromQuery(query){const raw=query.ciclo || '0';if(!/^(0|[1-9][0-9]{0,8})$/.test(String(raw)))throw new AppError(422,'Ciclo incorrecto.');return Number(raw);}
async function report(ciclo){
 const [ciclos]=await pool.query('SELECT id,nombre FROM ciclos_lectivos ORDER BY id DESC');
 if(ciclo && !ciclos.some(c=>c.id===ciclo))throw new AppError(404,'Ciclo no encontrado.');
 const [[st]]=await pool.execute(`SELECT
 (SELECT COUNT(*) FROM estudiantes e JOIN usuarios u ON u.id=e.usuario_id WHERE u.activo=1) AS estudiantes,
 (SELECT COUNT(*) FROM docentes d JOIN usuarios u ON u.id=d.usuario_id WHERE u.activo=1) AS docentes,
 (SELECT COUNT(*) FROM matriculas WHERE estado='ACTIVA' AND (?=0 OR ciclo_id=?)) AS matriculas,
 (SELECT COUNT(*) FROM secciones WHERE activa=1 AND (?=0 OR ciclo_id=?)) AS secciones,
 (SELECT COUNT(*) FROM calificaciones n JOIN matriculas m ON m.id=n.matricula_id WHERE (?=0 OR m.ciclo_id=?)) AS notas,
 (SELECT ROUND(AVG(n.nota),2) FROM calificaciones n JOIN matriculas m ON m.id=n.matricula_id WHERE (?=0 OR m.ciclo_id=?)) AS promedio`,[ciclo,ciclo,ciclo,ciclo,ciclo,ciclo,ciclo,ciclo]);
 const [secciones]=await pool.execute(`SELECT CONCAT(s.nombre,' / ',c.nombre) AS nombre,COUNT(m.id) AS matriculas
 FROM secciones s JOIN ciclos_lectivos c ON c.id=s.ciclo_id
 LEFT JOIN matriculas m ON m.seccion_id=s.id AND m.estado='ACTIVA'
 WHERE (?=0 OR s.ciclo_id=?) GROUP BY s.id,c.nombre ORDER BY matriculas DESC,s.nombre`,[ciclo,ciclo]);
 const [asignaturas]=await pool.execute(`SELECT mat.nombre,COUNT(n.id) AS calificaciones,ROUND(AVG(n.nota),2) AS promedio
 FROM asignaciones_docentes a JOIN asignaturas mat ON mat.id=a.asignatura_id
 LEFT JOIN calificaciones n ON n.asignacion_id=a.id
 WHERE (?=0 OR a.ciclo_id=?) GROUP BY mat.id,mat.nombre ORDER BY mat.nombre`,[ciclo,ciclo]);
 const [[distribucion]]=await pool.execute(`SELECT SUM(CASE WHEN n.nota>=6 THEN 1 ELSE 0 END) AS aprobatorias,
 SUM(CASE WHEN n.nota<6 THEN 1 ELSE 0 END) AS menores
 FROM calificaciones n JOIN matriculas m ON m.id=n.matricula_id WHERE (?=0 OR m.ciclo_id=?)`,[ciclo,ciclo]);
 return {ciclo,ciclos,stats:st,secciones,asignaturas,distribucion:{aprobatorias:Number(distribucion.aprobatorias||0),menores:Number(distribucion.menores||0)}};
}
module.exports={report,cicloFromQuery};
