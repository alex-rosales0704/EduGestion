'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool, transaction } = require('../src/config/db');
// Solamente datos ficticios para la demostración académica local.
const DEMO_PASSWORD='Demo2026!';
async function usuario(conn,rol,correo,tabla,codigo,clave,datos){
 const [[u]=[]]=await conn.execute('SELECT id FROM usuarios WHERE correo=?',[correo]);
 if(u)return u.id;
 const [created]=await conn.execute('INSERT INTO usuarios(rol_id,correo,password_hash) VALUES (?,?,?)',[rol,correo,await bcrypt.hash(DEMO_PASSWORD,12)]);
 if(tabla){
   const fields=['usuario_id',codigo,...Object.keys(datos)];
   const vals=[created.insertId,clave,...Object.values(datos)];
   await conn.execute(`INSERT INTO ${tabla} (${fields.map(f=>'`'+f+'`').join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,vals);
 }
 return created.insertId;
}
async function seed(){
 await transaction(async c=>{
  await c.execute('INSERT IGNORE INTO roles(id,nombre) VALUES (1,?),(2,?),(3,?)',['ADMINISTRADOR','DOCENTE','ESTUDIANTE']);
  await usuario(c,1,'admin@edugestion.test',null,null,null,{});
  const docentes=[['DOC001','María','Pérez','Matemática'],['DOC002','Daniel','Rivas','Ciencias']];
  for(const [cod,nombre,apellido,especialidad] of docentes)
   await usuario(c,2,cod==='DOC001'?'docente@edugestion.test':'daniel@edugestion.test','docentes','codigo_docente',cod,{nombres:nombre,apellidos:apellido,especialidad,telefono:'7000-0000'});
  const alumnos=[['EST001','Carlos','García'],['EST002','Valeria','López'],['EST003','Emilio','Ramírez'],['EST004','Sofía','Torres'],['EST005','Andrea','Molina'],['EST006','Diego','Martínez']];
  for(const [i,[carnet,nombres,apellidos]] of alumnos.entries()){
    await usuario(c,3,i===0?'estudiante@edugestion.test':`${carnet.toLowerCase()}@edugestion.test`, 'estudiantes','carnet',carnet,{nombres,apellidos,fecha_nacimiento:'2008-03-20',telefono:null,direccion:'San Salvador',fecha_ingreso:'2026-01-15'});
  }
  await c.execute("INSERT IGNORE INTO ciclos_lectivos(nombre,fecha_inicio,fecha_fin,estado) VALUES ('2026','2026-01-01','2026-12-31','ABIERTO')");
  const [[ciclo]]=await c.execute("SELECT id FROM ciclos_lectivos WHERE nombre='2026'");
  for(const [codigo,nombre,descripcion] of [['MAT-01','Matemática','Álgebra y razonamiento'],['LEN-01','Lenguaje y Literatura','Comprensión y comunicación'],['CIE-01','Ciencias Naturales','Biología, física y química'],['INF-01','Informática','Fundamentos y aplicaciones tecnológicas']])
    await c.execute('INSERT IGNORE INTO asignaturas(codigo,nombre,descripcion) VALUES (?,?,?)',[codigo,nombre,descripcion]);
  for(const [nombre,nivel,jornada] of [['1A','Bachillerato','Matutina'],['1B','Bachillerato','Vespertina']])
    await c.execute('INSERT IGNORE INTO secciones(ciclo_id,nombre,nivel,jornada) VALUES (?,?,?,?)',[ciclo.id,nombre,nivel,jornada]);
  const [[seccion]]=await c.execute('SELECT id FROM secciones WHERE ciclo_id=? AND nombre=?',[ciclo.id,'1A']);
  const [materias]=await c.execute('SELECT id,codigo FROM asignaturas WHERE codigo IN (?,?,?,?)',['MAT-01','LEN-01','CIE-01','INF-01']);
  const [[doc1]]=await c.execute("SELECT id FROM docentes WHERE codigo_docente='DOC001'");
  const [[doc2]]=await c.execute("SELECT id FROM docentes WHERE codigo_docente='DOC002'");
  for(const materia of materias)
    await c.execute('INSERT IGNORE INTO asignaciones_docentes(docente_id,asignatura_id,seccion_id,ciclo_id) VALUES (?,?,?,?)',[materia.codigo==='CIE-01'?doc2.id:doc1.id,materia.id,seccion.id,ciclo.id]);
  for(const [carnet] of alumnos){
    const [[est]]=await c.execute('SELECT id FROM estudiantes WHERE carnet=?',[carnet]);
    await c.execute('INSERT IGNORE INTO matriculas(estudiante_id,seccion_id,ciclo_id,fecha_matricula) VALUES (?,?,?,?)',[est.id,seccion.id,ciclo.id,'2026-01-15']);
  }
  for(const [nombre,peso,desde,hasta] of [['Periodo 1',50,'2026-01-01','2026-06-30'],['Periodo 2',50,'2026-07-01','2026-12-31']])
    await c.execute('INSERT IGNORE INTO periodos_evaluacion(ciclo_id,nombre,ponderacion,fecha_inicio,fecha_fin) VALUES (?,?,?,?,?)',[ciclo.id,nombre,peso,desde,hasta]);
  const [periodos]=await c.execute('SELECT id FROM periodos_evaluacion WHERE ciclo_id=? ORDER BY id',[ciclo.id]);
  const [asignaciones]=await c.execute('SELECT id FROM asignaciones_docentes WHERE seccion_id=? ORDER BY id',[seccion.id]);
  const [matriculas]=await c.execute('SELECT m.id FROM matriculas m WHERE m.seccion_id=? AND m.estado=? ORDER BY id',[seccion.id,'ACTIVA']);
  for(let i=0;i<matriculas.length;i++){
    for(let j=0;j<asignaciones.length;j++){
      const primero=Number((6.8+(i+j)%4*0.6).toFixed(2));
      const segundo=Number((7.1+(i+j+1)%4*0.55).toFixed(2));
      if(periodos[0])await c.execute('INSERT IGNORE INTO calificaciones(matricula_id,asignacion_id,periodo_id,nota) VALUES (?,?,?,?)',[matriculas[i].id,asignaciones[j].id,periodos[0].id,primero]);
      if(periodos[1] && (i+j)%4!==3)await c.execute('INSERT IGNORE INTO calificaciones(matricula_id,asignacion_id,periodo_id,nota) VALUES (?,?,?,?)',[matriculas[i].id,asignaciones[j].id,periodos[1].id,segundo]);
    }
  }
 });
 console.log('✓ Datos ficticios cargados.');
 console.log('Admin: admin@edugestion.test | Docente: docente@edugestion.test | Estudiante: estudiante@edugestion.test');
 console.log('Contraseña de demostración: '+DEMO_PASSWORD);
}
if(require.main===module)seed().catch(e=>{console.error('Error creando datos de demostración:',e.message);process.exitCode=1;}).finally(()=>pool.end());
module.exports={seed};
