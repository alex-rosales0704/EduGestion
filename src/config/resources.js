'use strict';
// Todas las tablas y columnas interpoladas están declaradas aquí (lista de permitidos).
const resources = {
  ciclos: {
    title:'Ciclos lectivos',table:'ciclos_lectivos',editable:true,close:true,
    columns:[['nombre','Ciclo'],['fecha_inicio','Inicio'],['fecha_fin','Fin'],['estado','Estado']],
    fields:[{name:'nombre',label:'Nombre del ciclo',required:true,max:90},{name:'fecha_inicio',label:'Fecha de inicio',type:'date',required:true},{name:'fecha_fin',label:'Fecha de fin',type:'date',required:true}],
    sql:'SELECT id,nombre,fecha_inicio,fecha_fin,estado FROM ciclos_lectivos ORDER BY id DESC'
  },
  asignaturas: {
    title:'Asignaturas',table:'asignaturas',editable:true,deactivate:true,
    columns:[['codigo','Código'],['nombre','Asignatura'],['descripcion','Descripción'],['estado_texto','Estado']],
    fields:[{name:'codigo',label:'Código',required:true,max:20},{name:'nombre',label:'Nombre',required:true,max:120},{name:'descripcion',label:'Descripción',type:'textarea',max:1000}],
    sql:"SELECT id,codigo,nombre,descripcion,CASE WHEN activa=1 THEN 'Activa' ELSE 'Inactiva' END AS estado_texto, activa FROM asignaturas ORDER BY nombre"
  },
  secciones: {
    title:'Secciones',table:'secciones',editable:true,deactivate:true,
    columns:[['nombre','Sección'],['ciclo_nombre','Ciclo'],['nivel','Nivel'],['jornada','Jornada'],['estado_texto','Estado']],
    fields:[{name:'ciclo_id',label:'Ciclo lectivo',type:'select',source:'ciclos',required:true,createOnly:true}, {name:'nombre',label:'Nombre',required:true,max:40},{name:'nivel',label:'Nivel',required:true,max:60},{name:'jornada',label:'Jornada',required:true,max:30}],
    sql:"SELECT s.*,c.nombre AS ciclo_nombre,IF(s.activa,'Activa','Inactiva') AS estado_texto FROM secciones s JOIN ciclos_lectivos c ON c.id=s.ciclo_id ORDER BY s.id DESC"
  },
  periodos: {
    title:'Periodos de evaluación',table:'periodos_evaluacion',editable:true,close:true,
    columns:[['nombre','Periodo'],['ciclo_nombre','Ciclo'],['ponderacion','Peso (%)'],['fecha_inicio','Inicio'],['fecha_fin','Fin'],['estado','Estado']],
    fields:[{name:'ciclo_id',label:'Ciclo lectivo',type:'select',source:'ciclos',required:true,createOnly:true}, {name:'nombre',label:'Nombre',required:true,max:50}, {name:'ponderacion',label:'Ponderación (%)',type:'number',min:0.01,max:100,required:true},{name:'fecha_inicio',label:'Inicio',type:'date',required:true},{name:'fecha_fin',label:'Fin',type:'date',required:true}],
    sql:'SELECT p.*,c.nombre AS ciclo_nombre FROM periodos_evaluacion p JOIN ciclos_lectivos c ON c.id=p.ciclo_id ORDER BY p.ciclo_id,p.id'
  },
  asignaciones: {
    title:'Asignaciones académicas',table:'asignaciones_docentes',editable:false,deactivate:true,
    columns:[['docente_nombre','Docente'],['asignatura_nombre','Asignatura'],['seccion_nombre','Sección'],['ciclo_nombre','Ciclo'],['estado_texto','Estado']],
    fields:[{name:'ciclo_id',label:'Ciclo',type:'select',source:'ciclos',required:true},{name:'seccion_id',label:'Sección',type:'select',source:'secciones',required:true},{name:'docente_id',label:'Docente',type:'select',source:'docentes',required:true},{name:'asignatura_id',label:'Asignatura',type:'select',source:'asignaturas',required:true}],
    sql:"SELECT a.*,CONCAT(d.nombres,' ',d.apellidos) AS docente_nombre,m.nombre AS asignatura_nombre,s.nombre AS seccion_nombre,c.nombre AS ciclo_nombre,IF(a.activa,'Activa','Inactiva') AS estado_texto FROM asignaciones_docentes a JOIN docentes d ON d.id=a.docente_id JOIN asignaturas m ON m.id=a.asignatura_id JOIN secciones s ON s.id=a.seccion_id JOIN ciclos_lectivos c ON c.id=a.ciclo_id ORDER BY a.id DESC"
  },
  matriculas: {
    title:'Matrículas',table:'matriculas',editable:false,retire:true,
    columns:[['estudiante_nombre','Estudiante'],['seccion_nombre','Sección'],['ciclo_nombre','Ciclo'],['fecha_matricula','Fecha'],['estado','Estado']],
    fields:[{name:'ciclo_id',label:'Ciclo',type:'select',source:'ciclos',required:true},{name:'seccion_id',label:'Sección',type:'select',source:'secciones',required:true},{name:'estudiante_id',label:'Estudiante',type:'select',source:'estudiantes',required:true},{name:'fecha_matricula',label:'Fecha de matrícula',type:'date',required:true}],
    sql:"SELECT m.*,CONCAT(e.nombres,' ',e.apellidos) AS estudiante_nombre,s.nombre AS seccion_nombre,c.nombre AS ciclo_nombre FROM matriculas m JOIN estudiantes e ON e.id=m.estudiante_id JOIN secciones s ON s.id=m.seccion_id JOIN ciclos_lectivos c ON c.id=m.ciclo_id ORDER BY m.id DESC"
  }
};
module.exports = resources;
