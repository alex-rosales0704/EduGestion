'use strict';
const service=require('../services/academicReportService');
const {workbook}=require('../services/xlsxService');
const {reporteAcademicoPDF}=require('../services/reportService');
const {AppError}=require('../middlewares/errors');
async function admin(req,res){const datos=await service.report(service.cicloFromQuery(req.query));res.render('admin/reportes',{title:'Reportes y estadísticas',...datos});}
async function exportAdmin(req,res){
 const fmt=req.params.formato;
 if(!['pdf','xlsx'].includes(fmt))throw new AppError(404,'Formato de reporte no disponible.');
 const datos=await service.report(service.cicloFromQuery(req.query));
 if(fmt==='pdf')return reporteAcademicoPDF(res,datos);
 const sheets=[
  {name:'Resumen',rows:[['Indicador','Total'],['Estudiantes activos',datos.stats.estudiantes],['Docentes activos',datos.stats.docentes],['Matrículas activas',datos.stats.matriculas],['Secciones activas',datos.stats.secciones],['Notas registradas',datos.stats.notas],['Media de notas',Number(datos.stats.promedio||0)]]},
  {name:'Por sección',rows:[['Sección / Ciclo','Matrículas activas'],...datos.secciones.map(s=>[s.nombre,Number(s.matriculas)])]},
  {name:'Por asignatura',rows:[['Asignatura','Calificaciones registradas','Promedio'],...datos.asignaturas.map(a=>[a.nombre,Number(a.calificaciones),a.promedio===null?'Sin notas':Number(a.promedio)])]},
  {name:'Distribución',rows:[['Tipo de calificación','Cantidad'],['Nota >= 6',datos.distribucion.aprobatorias],['Nota < 6',datos.distribucion.menores]]}
 ];
 res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
 res.attachment(`edugestion_reporte_${datos.ciclo||'general'}.xlsx`);
 res.send(workbook(sheets));
}
module.exports={admin,exportAdmin};
