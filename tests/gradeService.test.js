'use strict';
const test = require('node:test'); const assert = require('node:assert/strict');
const { calcularPromedio, notaValida, EsquemaEvaluacion } = require('../src/services/gradeService');
test('Promedio ponderado 40% y 60%', () => {
  const r = calcularPromedio([{id:1,ponderacion:40},{id:2,ponderacion:60}], [{periodo_id:1,nota:8},{periodo_id:2,nota:9}]);
  assert.equal(r.promedioFinal, 8.6); assert.equal(r.completo, true);
});
test('Promedio pendiente con nota faltante', () => {
  const r = calcularPromedio([{id:1,ponderacion:50},{id:2,ponderacion:50}], [{periodo_id:1,nota:7}]);
  assert.equal(r.promedioFinal, null); assert.equal(r.ponderadoAcumulado, 3.5);
});
test('No calcula promedio final con ponderaciones distintas de 100', () => {
  assert.equal(calcularPromedio([{id:1,ponderacion:70}], [{periodo_id:1,nota:9}]).completo, false);
});
test('Notas entre 0 y 10 con dos decimales como máximo', () => {
  for (const x of ['0','0.00','9.99','10','10.00']) assert.equal(notaValida(x), true);
  for (const x of ['-1','11','8.999','x','',null,'1e0']) assert.equal(notaValida(x), false);
});

test('Objeto de esquema evaluativo calcula promedio', () => {
  const esquema = new EsquemaEvaluacion([{id:1, ponderacion:100}]);
  assert.equal(esquema.calcular([{periodo_id:1,nota:6}]).promedioFinal, 6);
});
