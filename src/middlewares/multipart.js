'use strict';
// Analizador multipart acotado para el único formulario de documentos. Evita incorporar dependencias adicionales.
const { AppError } = require('./errors');
const LIMIT = 6 * 1024 * 1024;
function parseBoundary(type) {
  const match = /^multipart\/form-data\s*;.*?boundary=(?:"([\w'()+_,.\/:=?-]{1,120})"|([\w'()+_,.\/:=?-]{1,120}))/i.exec(type || '');
  if (!match) throw new AppError(415, 'El formulario debe enviarse como multipart/form-data.');
  return Buffer.from('--' + (match[1] || match[2]), 'ascii');
}
function multipartParts(buffer, boundary) {
  const fields = Object.create(null);
  let file = null;
  let pos = buffer.indexOf(boundary);
  if (pos !== 0) throw new AppError(422, 'Contenido de archivo incorrecto.');
  while (pos >= 0) {
    pos += boundary.length;
    if (buffer.subarray(pos, pos + 2).toString('ascii') === '--') break;
    if (buffer.subarray(pos, pos + 2).toString('ascii') !== '\r\n') throw new AppError(422, 'Datos multipart inválidos.');
    const headerEnd = buffer.indexOf('\r\n\r\n', pos + 2, 'ascii');
    if (headerEnd < 0 || headerEnd - pos > 8192) throw new AppError(422, 'Cabeceras de archivo inválidas.');
    const headers = buffer.subarray(pos + 2, headerEnd).toString('latin1');
    const disposition = headers.match(/^content-disposition:\s*form-data;\s*name="([a-zA-Z0-9_]{1,60})"(?:;\s*filename="([^"]{0,255})")?/im);
    if (!disposition) throw new AppError(422, 'Parte multipart no reconocida.');
    const next = buffer.indexOf(boundary, headerEnd + 4);
    if (next < 0 || buffer.subarray(next - 2, next).toString('ascii') !== '\r\n') throw new AppError(422, 'Archivo incompleto.');
    const data = buffer.subarray(headerEnd + 4, next - 2);
    const [, name, filename] = disposition;
    if (filename !== undefined) {
      if (file || name !== 'archivo') throw new AppError(422, 'Solo se permite adjuntar un archivo.');
      file = { originalname: filename, mimetype: headers.match(/^content-type:\s*([^\r\n]+)/im)?.[1].trim().toLowerCase() || '', buffer: data };
    } else {
      if (data.length > 4096 || Object.hasOwn(fields,name)) throw new AppError(422, 'Campo inválido o demasiado extenso.');
      fields[name] = data.toString('utf8');
    }
    pos = next;
  }
  return {fields,file};
}
async function parseDocumentUpload(req,res,next) {
  if (req.method !== 'POST' || req.path !== '/admin/documentos') return next();
  try {
    const boundary = parseBoundary(req.headers['content-type']);
    if (Number(req.headers['content-length'] || 0) > LIMIT) throw new AppError(413,'El envío supera los 6 MB permitidos.');
    const parts=[];let size=0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > LIMIT) throw new AppError(413,'El envío supera los 6 MB permitidos.');
      parts.push(chunk);
    }
    const parsed = multipartParts(Buffer.concat(parts),boundary);
    req.body=parsed.fields;
    req.uploadedFile=parsed.file;
    next();
  } catch(err) { next(err); }
}
module.exports={ parseDocumentUpload,multipartParts,parseBoundary,LIMIT };
