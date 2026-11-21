'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const ejs=require('ejs');
const {validateUpload}=require('../src/services/documentService');
const {multipartParts,parseBoundary}=require('../src/middlewares/multipart');
const {workbook}=require('../src/services/xlsxService');
const {cicloFromQuery}=require('../src/services/academicReportService');
const {AppError}=require('../src/middlewares/errors');
const root=path.join(__dirname,'..');
test('Valida firmas de archivos permitidos y rechaza contenido de otro tipo',()=>{
 const png=Buffer.from('89504e470d0a1a0a000000','hex');
 assert.equal(validateUpload({originalname:'imagen.png',buffer:png}).mime,'image/png');
 assert.throws(()=>validateUpload({originalname:'imagen.pdf',buffer:png}),AppError);
 assert.throws(()=>validateUpload({originalname:'malicioso.exe',buffer:Buffer.from('MZtest')}),AppError);
 assert.throws(()=>validateUpload({originalname:'grande.pdf',buffer:Buffer.alloc(5*1024*1024+1)}),AppError);
});
test('Parser multipart conserva contenido binario y campos CSRF',()=>{
 const boundary='----TestBoundary42';const pdf=Buffer.from('%PDF-1.4\nabc\0def','binary');
 const body=Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="_csrf"\r\n\r\nsecret\r\n`),
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="archivo"; filename="constancia.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),pdf,Buffer.from(`\r\n--${boundary}--\r\n`)
 ]);
 const parsed=multipartParts(body,parseBoundary('multipart/form-data; boundary='+boundary));
 assert.equal(parsed.fields._csrf,'secret');assert.deepEqual(parsed.file.buffer,pdf);
});
test('Exportación XLSX genera un archivo ZIP Office Open XML con hojas',()=>{
 const data=workbook([{name:'Resumen',rows:[['Indicador','Valor'],['Media',8.5],['Formula externa','=HYPERLINK("x")']]},{name:'Secciones',rows:[['Grupo','N'],['1A',6]]}]);
 assert.equal(data.subarray(0,2).toString(),'PK');
 assert.ok(data.includes(Buffer.from('xl/worksheets/sheet1.xml')));
 assert.ok(data.includes(Buffer.from('xl/worksheets/sheet2.xml')));
});
test('Valida filtro de ciclo numérico',()=>{
 assert.equal(cicloFromQuery({}),0);assert.equal(cicloFromQuery({ciclo:'10'}),10);
 assert.throws(()=>cicloFromQuery({ciclo:'1 OR 1=1'}),AppError);
});
test('Vistas del Sprint III compilan correctamente en EJS',()=>{
 for(const view of ['admin/reportes.ejs','admin/documentos.ejs','admin/detalle.ejs','estudiante/documentos.ejs','partials/header.ejs']){
  assert.doesNotThrow(()=>ejs.compile(fs.readFileSync(path.join(root,'src/views',view),'utf8'),{filename:path.join(root,'src/views',view)}),view);
 }
});
test('Endpoints requieren sesión de usuario y el login sigue disponible',async()=>{
 // El archivo ZIP original incluye un bcrypt nativo compilado en Windows; este test solo prueba rutas GET.
 require.cache[require.resolve('bcrypt')]={id:require.resolve('bcrypt'),filename:require.resolve('bcrypt'),loaded:true,exports:{compare:async()=>false,hash:async()=>''}};
 const app=require('../src/app');const server=await new Promise(resolve=>{const s=app.listen(0,()=>resolve(s));});
 const url='http://127.0.0.1:'+server.address().port;
 try{
  const login=await fetch(url+'/login',{redirect:'manual'});
  assert.equal(login.status,200);assert.match(await login.text(),/Ingresar a la plataforma/);
  const admin=await fetch(url+'/admin/reportes',{redirect:'manual'});
  assert.equal(admin.status,302);assert.equal(admin.headers.get('location'),'/login');
  const student=await fetch(url+'/estudiante/documentos',{redirect:'manual'});
  assert.equal(student.status,302);
  const pdf=await fetch(url+'/documentos/1/descargar',{redirect:'manual'});
  assert.equal(pdf.status,302);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
