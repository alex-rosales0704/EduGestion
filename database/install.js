'use strict';
/** Instalación automática del esquema SQL, sin interfaces gráficas. */
require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');

async function install(config) {
  const connection = await mysql.createConnection({
    host: config.host || '127.0.0.1',
    port: Number(config.port || 3306),
    user: config.user || 'root',
    password: config.password || '',
    multipleStatements: true,
    connectTimeout: 10000
  });
  try {
    const sql = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(sql);
    const [[count]] = await connection.query("SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = 'edugestion_web'");
    console.log(`✓ Base de datos creada o actualizada: edugestion_web (${count.total} tablas).`);
  } finally { await connection.end(); }
}

if (require.main === module) {
  install({host:process.env.DB_HOST,port:process.env.DB_PORT,user:process.env.DB_USER,password:process.env.DB_PASSWORD})
    .catch(err => {console.error('No se pudo preparar MySQL:', err.message);process.exitCode=1;});
}
module.exports = { install };
