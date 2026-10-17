'use strict';
const { pool } = require('../config/db');
const resources = require('../config/resources');
const { AppError } = require('../middlewares/errors');
function definition(resource) {
 const d = resources[resource]; if (!d) throw new AppError(404,'Módulo desconocido.'); return d;
}
async function list(resource) { const [rows] = await pool.query(definition(resource).sql); return rows; }
async function one(resource,id) {const d=definition(resource);const [[r]=[]]=await pool.execute(`SELECT * FROM ${d.table} WHERE id=?`,[id]);if(!r)throw new AppError(404,'Registro no encontrado.');return r;}
async function options() {
 const [ciclos]=await pool.query("SELECT id,nombre AS label FROM ciclos_lectivos WHERE estado='ABIERTO' ORDER BY id DESC");
 const [secciones]=await pool.query("SELECT s.id,CONCAT(s.nombre,' / ',c.nombre) AS label FROM secciones s JOIN ciclos_lectivos c ON c.id=s.ciclo_id WHERE s.activa=1 AND c.estado='ABIERTO' ORDER BY s.nombre");
 const [asignaturas]=await pool.query("SELECT id,CONCAT(codigo,' - ',nombre) AS label FROM asignaturas WHERE activa=1 ORDER BY nombre");
 const [docentes]=await pool.query("SELECT d.id,CONCAT(d.codigo_docente,' - ',d.nombres,' ',d.apellidos) AS label FROM docentes d JOIN usuarios u ON u.id=d.usuario_id WHERE u.activo=1 ORDER BY d.nombres");
 const [estudiantes]=await pool.query("SELECT e.id,CONCAT(e.carnet,' - ',e.nombres,' ',e.apellidos) AS label FROM estudiantes e JOIN usuarios u ON u.id=e.usuario_id WHERE u.activo=1 ORDER BY e.nombres");
 return { ciclos,secciones,asignaturas,docentes,estudiantes };
}
module.exports = {definition,list,one,options};
