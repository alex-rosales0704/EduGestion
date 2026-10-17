'use strict';
const t=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
t('La instalación MySQL corre mediante código Node.js',()=>{
  assert.match(read('database/install.js'),/multipleStatements:\s*true/);
  assert.match(read('scripts/configurar.js'),/install\(\{host,port,user,password\}\)/);
});
t('El esquema contiene las entidades académicas de Sprint I',()=>{
  const sql=read('database/schema.sql');
  for(const nombre of ['roles','usuarios','estudiantes','docentes','ciclos_lectivos','asignaturas','secciones','matriculas','asignaciones_docentes','periodos_evaluacion','calificaciones'])assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS '+nombre+'\\b'));
});
t('El esquema contiene restricciones y claves foráneas',()=>{
  const sql=read('database/schema.sql');assert.match(sql,/FOREIGN KEY/);assert.match(sql,/UNIQUE KEY/);assert.match(sql,/CHECK \(nota >= 0 AND nota <= 10\)/);
});
t('Las pantallas por rol existen',()=>{
  for(const f of ['auth/login.ejs','admin/dashboard.ejs','admin/form.ejs','admin/users-list.ejs','docente/dashboard.ejs','docente/notas.ejs','estudiante/calificaciones.ejs','perfil.ejs'])assert.ok(fs.existsSync(path.join(root,'src/views',f)),f);
});
t('La descarga PDF está vinculada a estudiante autenticado',()=>{
  assert.match(read('src/routes/estudiante.routes.js'),/requireRole\('ESTUDIANTE'\)/);
  assert.match(read('src/routes/estudiante.routes.js'),/\/boleta/);
});
