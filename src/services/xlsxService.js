'use strict';
// Generador OOXML (XLSX) independiente: ZIP DEFLATE + hojas con celdas inlineString.
// Únicamente se exportan datos; no se evalúan fórmulas introducidas por usuarios.
const zlib=require('node:zlib');
const escape=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const xmlDecl='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
function col(n){let result='';for(let x=n+1;x;x=Math.floor((x-1)/26))result=String.fromCharCode(65+(x-1)%26)+result;return result;}
function worksheet(rows){
 const rs=rows.map((row,i)=>'<row r="'+(i+1)+'">'+row.map((v,j)=>{
   const r=col(j)+(i+1);
   if(typeof v==='number' && Number.isFinite(v))return `<c r="${r}" s="${i===0?1:0}"><v>${v}</v></c>`;
   // Force text, preventing spreadsheet formula injection.
   return `<c r="${r}" t="inlineStr" s="${i===0?1:0}"><is><t xml:space="preserve">${escape(v)}</t></is></c>`;
 }).join('')+'</row>').join('');
 const width=rows.reduce((m,r)=>Math.max(m,r.length),1);
 const cols=Array.from({length:width},(_,i)=>`<col min="${i+1}" max="${i+1}" width="${i===0?33:22}" customWidth="1"/>`).join('');
 return xmlDecl+`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${cols}</cols><sheetData>${rs}</sheetData></worksheet>`;
}
const crcTable=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(buffer){let c=0xffffffff;for(const b of buffer)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function zip(files){const locals=[],entries=[];let offset=0;
 for(const [name,content] of files){const fname=Buffer.from(name),input=Buffer.from(content),compressed=zlib.deflateRawSync(input);const crc=crc32(input);
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(input.length,22);local.writeUInt16LE(fname.length,26);
  locals.push(local,fname,compressed);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(input.length,24);central.writeUInt16LE(fname.length,28);central.writeUInt32LE(offset,42);
  entries.push(central,fname);offset+=local.length+fname.length+compressed.length;
 }
 const cd=Buffer.concat(entries),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,cd,end]);}
function workbook(sheets){
 const titles=sheets.map((sheet,i)=>`<sheet name="${escape(sheet.name.slice(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('');
 const rels=sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('');
 const overrides=sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
 const files=[
 ['[Content_Types].xml',xmlDecl+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}</Types>`],
 ['_rels/.rels',xmlDecl+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
 ['xl/workbook.xml',xmlDecl+`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${titles}</sheets></workbook>`],
 ['xl/_rels/workbook.xml.rels',xmlDecl+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
 ['xl/styles.xml',xmlDecl+`<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF17315C"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1"/></cellXfs></styleSheet>`]
 ];
 sheets.forEach((s,i)=>files.push([`xl/worksheets/sheet${i+1}.xml`,worksheet(s.rows)]));
 return zip(files);
}
module.exports={workbook,worksheet,zip,escape};
