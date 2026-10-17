'use strict';
/** Asistente de primera ejecución. No requiere MySQL Workbench. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { install } = require('../database/install');
const envPath = path.join(__dirname, '..', '.env');

async function main() {
  console.log('\n============================================');
  console.log('  EduGestion Web  |  Configuración inicial');
  console.log('============================================');
  console.log('Este asistente creará las tablas desde código.');
  const rl = readline.createInterface({input:stdin,output:stdout});
  let host,port,user,password;
  try {
    host = (await rl.question('Servidor MySQL [127.0.0.1]: ')).trim() || '127.0.0.1';
    port = (await rl.question('Puerto MySQL [3306]: ')).trim() || '3306';
    user = (await rl.question('Usuario MySQL [root]: ')).trim() || 'root';
    password = await rl.question('Contraseña local de MySQL (se verá al escribir): ');
  } finally {rl.close();}
  if (!/^\d{2,5}$/.test(port) || Number(port)>65535) throw Error('Puerto inválido.');
  console.log('\nConectando y creando tablas...');
  await install({host,port,user,password});
  const settings={DB_HOST:host,DB_PORT:port,DB_USER:user,DB_PASSWORD:password,DB_NAME:'edugestion_web',PORT:'3000',SESSION_SECRET:crypto.randomBytes(48).toString('hex'),NODE_ENV:'development'};
  const lines=Object.entries(settings).map(([key,val])=>`${key}=${JSON.stringify(val)}`).join('\n')+'\n';
  if(fs.existsSync(envPath)){
    const backup=envPath+'.respaldo';
    fs.copyFileSync(envPath,backup);
    console.log('Se conservó el archivo .env anterior en .env.respaldo');
  }
  fs.writeFileSync(envPath,lines,{mode:0o600});
  console.log('\nCargando datos ficticios para la demostración...');
  const result=spawnSync(process.execPath,['database/seed.js'],{cwd:path.join(__dirname,'..'),stdio:'inherit',env:{...process.env,...settings}});
  if(result.status!==0)throw Error('Las tablas se crearon pero la carga demo falló. Intenta: npm run demo');
  console.log('\n✓ TODO LISTO. Ahora ejecuta npm start y visita http://localhost:3000');
}
main().catch(e=>{console.error('\n✗ Configuración incompleta:',e.message);console.error('Comprueba que MySQL Server esté iniciado y que la contraseña sea correcta.');process.exitCode=1;});
