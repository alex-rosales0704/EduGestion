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
