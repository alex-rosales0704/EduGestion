'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const resources=require('../src/config/resources');
test('Catálogos priorizados disponibles',()=>{
 for(const type of ['ciclos','asignaturas','secciones','periodos','asignaciones','matriculas'])assert.ok(resources[type]);
});
test('Tablas de recursos proceden de la lista de permitidos',()=>{
 for(const [key,def] of Object.entries(resources)){
   assert.match(key,/^[a-z]+$/);assert.match(def.table,/^[a-z_]+$/);
   for(const field of def.fields)assert.match(field.name,/^[a-z_]+$/);
 }
});
