'use strict';
require('dotenv').config();
const {pool}=require('../src/config/db');
(async()=>{
 const [tablas]=await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name",[process.env.DB_NAME||'edugestion_web']);
 console.log('\n=== EduGestion Web: comprobación de MySQL ===');
 for(const item of tablas)console.log('✓ '+(item.TABLE_NAME || item.table_name));
 const [cuentas]=await pool.query('SELECT r.nombre AS rol, COUNT(*) AS total FROM usuarios u JOIN roles r ON r.id=u.rol_id GROUP BY r.nombre');
 console.table(cuentas);
 const [[notas]]=await pool.query('SELECT COUNT(*) AS total FROM calificaciones');
 console.log('Calificaciones persistidas:',notas.total);
 console.log('✓ Base de datos conectada correctamente.');
})().catch(err=>{console.error('✗ No se pudo verificar la base de datos:',err.message);process.exitCode=1;}).finally(()=>pool.end());
