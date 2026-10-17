'use strict';
const fs = require('node:fs'); const path = require('node:path'); const { spawnSync } = require('node:child_process');
let errors = 0;
function visit(dir) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir,n), s = fs.statSync(p);
    if (s.isDirectory()) visit(p);
    else if (n.endsWith('.js')) {
      const r = spawnSync(process.execPath, ['--check',p], { encoding:'utf8' });
      if (r.status !== 0) { errors++; console.error(p, r.stderr); }
    }
  }
}
['src','database','tests','scripts','public/js'].forEach(visit);
if (errors) process.exit(1);
console.log('Sintaxis JS correcta.');
