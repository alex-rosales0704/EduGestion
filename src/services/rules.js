'use strict';
const { AppError } = require('../middlewares/errors');
const { pool } = require('../config/db');
async function cicloAbierto(cicloId, conn = pool) {
  const [[row] = []] = await conn.execute('SELECT estado FROM ciclos_lectivos WHERE id = ?', [cicloId]);
  if (!row) throw new AppError(404, 'No existe el ciclo.');
  if (row.estado !== 'ABIERTO') throw new AppError(409, 'El ciclo está cerrado: no se permiten cambios académicos.');
}
async function coherenciaSeccion(seccionId, cicloId, conn = pool) {
  const [[row] = []] = await conn.execute('SELECT id FROM secciones WHERE id=? AND ciclo_id=? AND activa=1', [seccionId, cicloId]);
  if (!row) throw new AppError(422, 'La sección no corresponde al ciclo seleccionado o está inactiva.');
}
module.exports = { cicloAbierto, coherenciaSeccion };
