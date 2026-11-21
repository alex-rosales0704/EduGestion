'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {parseNotaEntries} = require('../src/services/notaInputService');
const {AppError} = require('../src/middlewares/errors');

test('RC.2: las notas de diferentes matrículas conservan su ID real', () => {
  assert.deepEqual(parseNotaEntries({matricula_1:'8.50',matricula_2:'10.00',matricula_18:'0'}), [
    {matriculaId:1,nota:8.5},
    {matriculaId:2,nota:10},
    {matriculaId:18,nota:0}
  ]);
});
test('RC.2: deja vacíos sin modificarlos al guardar',()=>{
  assert.deepEqual(parseNotaEntries({matricula_2:'',matricula_3:'   ',matricula_4:'9.25'}),[{matriculaId:4,nota:9.25}]);
});
test('RC.2: rechaza nota fuera de rango o con decimales excesivos',()=>{
  for(const valor of ['-1','11','6.123','hola']) {
    assert.throws(()=>parseNotaEntries({matricula_1:valor}),AppError);
  }
});
test('RC.2: rechaza arreglo que expresa-urlencoded podría crear con índices numéricos',()=>{
  assert.throws(()=>parseNotaEntries(['8.5','9.0']),AppError);
});
test('RC.2: conserva compatibilidad con objetos que tienen claves numéricas y valida IDs',()=>{
  assert.deepEqual(parseNotaEntries({'21':'7.5'}),[{matriculaId:21,nota:7.5}]);
  assert.throws(()=>parseNotaEntries({matricula_0:'5'}),AppError);
  assert.throws(()=>parseNotaEntries({matricula_x:'5'}),AppError);
});
test('RC.2: formulario EJS envía el prefijo matricula_ y no índices de array',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../src/views/docente/notas.ejs'),'utf8');
  assert.match(html,/name="notas\[matricula_<%= alumno\.matricula_id %>\]"/);
  assert.doesNotMatch(html,/name="notas\[<%= alumno\.matricula_id %>\]"/);
});
