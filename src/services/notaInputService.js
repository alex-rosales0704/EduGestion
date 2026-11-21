'use strict';
const {AppError} = require('../middlewares/errors');
const {notaValida} = require('./gradeService');

/**
 * Los nombres de campos se generan como notas[matricula_123].
 * No usar notas[123]: express.urlencoded({extended:true}) interpreta índices
 * numéricos como posiciones de un arreglo y pierde el ID real de matrícula.
 */
function parseNotaEntries(notas) {
  if (notas === null || typeof notas !== 'object' || Array.isArray(notas)) {
    throw new AppError(422, 'Formulario de calificaciones inválido. Recarga la página e inténtalo nuevamente.');
  }

  const resultado = [];
  for (const [campo, valor] of Object.entries(notas)) {
    const match = /^(?:matricula_)?([1-9]\d*)$/.exec(campo);
    const matriculaId = match ? Number(match[1]) : NaN;
    if (!Number.isSafeInteger(matriculaId)) {
      throw new AppError(422, 'Identificador de matrícula inválido. Recarga el formulario.');
    }
    if (typeof valor === 'string' && valor.trim() === '') continue;
    if (!notaValida(valor)) {
      throw new AppError(422, `La calificación de la matrícula #${matriculaId} debe estar entre 0 y 10, con un máximo de dos decimales.`);
    }
    resultado.push({matriculaId, nota: Number(String(valor).trim())});
  }
  return resultado;
}

module.exports = {parseNotaEntries};
