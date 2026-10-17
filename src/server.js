'use strict';
require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');
const port = Number(process.env.PORT || 3000);
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✓ Conexión MySQL establecida.');
    app.listen(port, () => console.log(`✓ EduGestion Web: http://localhost:${port}`));
  } catch (e) {
    console.error('No se puede conectar a MySQL:', e.message);
    process.exitCode = 1;
    await pool.end();
  }
})();
