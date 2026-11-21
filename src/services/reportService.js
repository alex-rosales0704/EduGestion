'use strict';
const PDFDocument=require('pdfkit');
function text(doc,value,x,y,options={}){doc.text(String(value??'-'),x,y,options);}
function boletaEstudiante(res,datos){
  const {estudiante,historial}=datos;
  const doc=new PDFDocument({size:'A4',margin:50,info:{Title:'Boleta de calificaciones - EduGestion Web',Author:'EduGestion Web'}});
  res.type('application/pdf');res.setHeader('Content-Disposition',`attachment; filename="boleta_${estudiante.carnet.replace(/[^a-zA-Z0-9_-]/g,'_')}.pdf"`);
  doc.pipe(res);
  const azul='#17315c',tinta='#182a42',gris='#617289',rojo='#ba4949';
  doc.rect(0,0,595,113).fill(azul);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(21);text(doc,'EduGestion Web',50,34);
  doc.font('Helvetica').fontSize(11).fillColor('#c8dbfa');text(doc,'BOLETA DE CALIFICACIONES',50,66);
  let y=143;
  doc.fillColor(tinta).font('Helvetica-Bold').fontSize(13);text(doc,`${estudiante.nombres} ${estudiante.apellidos}`,50,y);
  doc.font('Helvetica').fontSize(10).fillColor(gris);text(doc,`Carnet: ${estudiante.carnet}`,50,y+20);
  y+=64;
  for(const m of historial){
    if(y>690){doc.addPage();y=55;}
    doc.rect(50,y,495,34).fill('#edf3fc');
    doc.fillColor(azul).font('Helvetica-Bold').fontSize(12);text(doc,`Ciclo ${m.ciclo}  /  Sección ${m.seccion}`,62,y+10);
    y+=47;
    for(const a of m.materias){
      if(y>660){doc.addPage();y=60;}
      doc.fillColor(tinta).font('Helvetica-Bold').fontSize(11);text(doc,`${a.codigo}  -  ${a.asignatura}`,55,y);
      y+=22;
      for(const p of a.periodos){
        if(y>720){doc.addPage();y=55;}
        doc.font('Helvetica').fillColor(gris).fontSize(9);text(doc,`${p.nombre} (${p.ponderacion} %)`,60,y);
        text(doc,p.nota===null?'Pendiente':Number(p.nota).toFixed(2),457,y,{width:78,align:'right'});
        y+=16;
      }
      const completo=a.calculo.completo;
      doc.moveTo(55,y).lineTo(537,y).lineWidth(0.6).strokeColor('#dce4f0').stroke();y+=10;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(completo&&a.calculo.promedioFinal<6?rojo:azul);
      text(doc,completo?'Promedio final':'Acumulado provisional',60,y);
      text(doc,completo?a.calculo.promedioFinal.toFixed(2):a.calculo.ponderadoAcumulado.toFixed(2),457,y,{width:78,align:'right'});
      y+=35;
    }
    y+=8;
  }
  if(!historial.length){doc.fillColor(gris).fontSize(11);text(doc,'No hay matrículas registradas.',50,y);}
  doc.font('Helvetica').fontSize(8).fillColor(gris);
  doc.text('Nota mínima aprobatoria: 6.00 / 10.00. Un promedio provisional no equivale a una nota final.',50,770,{width:495});
  doc.end();
}
module.exports={boletaEstudiante};

function reporteAcademicoPDF(res,data){
 const doc=new PDFDocument({size:'A4',margin:45,info:{Title:'Reporte académico EduGestion Web'}});
 res.type('application/pdf');res.attachment(`edugestion_reporte_${data.ciclo||'general'}.pdf`);
 doc.pipe(res);
 const navy='#17315c',gray='#51627b';
 doc.rect(0,0,595,112).fill(navy);
 doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(21).text('EduGestion Web',45,33);
 doc.font('Helvetica').fontSize(11).text('REPORTE ACADÉMICO - SPRINT III',45,67);
 let y=137;
 const heading=(title)=>{if(y>720){doc.addPage();y=45;}doc.font('Helvetica-Bold').fontSize(13).fillColor(navy).text(title,45,y);y+=26;};
 const row=(left,right)=>{if(y>745){doc.addPage();y=45;}doc.font('Helvetica').fontSize(10).fillColor(gray).text(String(left),48,y,{width:380});doc.font('Helvetica-Bold').fillColor(navy).text(String(right??'-'),445,y,{width:100,align:'right'});y+=23;};
 const periodo=data.ciclo?data.ciclos.find(c=>c.id===data.ciclo)?.nombre:'Todos los ciclos';
 doc.fillColor(gray).fontSize(10).text('Ciclo: '+periodo,45,y);y+=32;
 heading('Indicadores generales');
 for(const [label,key] of [['Estudiantes activos','estudiantes'],['Docentes activos','docentes'],['Matrículas activas','matriculas'],['Secciones activas','secciones'],['Notas registradas','notas'],['Promedio de notas','promedio']])row(label,data.stats[key]??'Sin datos');
 y+=12;heading('Matrículas por sección');
 for(const s of data.secciones)row(s.nombre,s.matriculas);
 y+=12;heading('Rendimiento por asignatura');
 for(const a of data.asignaturas)row(`${a.nombre} (${a.calificaciones} notas)`,a.promedio??'Sin notas');
 y+=12;heading('Distribución de calificaciones');
 row('Notas de 6.00 a 10.00',data.distribucion.aprobatorias);
 row('Notas menores de 6.00',data.distribucion.menores);
 doc.font('Helvetica').fontSize(8).fillColor(gray).text('Estadísticas basadas en las calificaciones individuales registradas. No representan aprobación final por asignatura.',45,775,{width:500});
 doc.end();
}
module.exports.reporteAcademicoPDF=reporteAcademicoPDF;
