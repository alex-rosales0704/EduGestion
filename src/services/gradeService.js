'use strict';
// Servicio puro y testeable. Las notas faltantes no se consideran notas 0.
function calcularPromedio(periodos, calificaciones) {
  const total = periodos.reduce((sum, p) => sum + Number(p.ponderacion), 0);
  const mapa = new Map(calificaciones.map(n => [Number(n.periodo_id), Number(n.nota)]));
  const suma = periodos.reduce((sum, p) => sum + (mapa.has(Number(p.id)) ? mapa.get(Number(p.id)) * Number(p.ponderacion) / 100 : 0), 0);
  const completo = Math.abs(total - 100) < 0.000001 && periodos.length > 0 && periodos.every(p => mapa.has(Number(p.id)));
  return { ponderacionTotal: total, calificacionesRegistradas: mapa.size, ponderadoAcumulado: Number(suma.toFixed(2)), promedioFinal: completo ? Number(suma.toFixed(2)) : null, completo };
}
function notaValida(nota) {
  if (typeof nota !== 'string' && typeof nota !== 'number') return false;
  const valor = String(nota).trim();
  return /^(?:10(?:\.0{1,2})?|(?:\d)(?:\.\d{1,2})?)$/.test(valor) && Number(valor) >= 0 && Number(valor) <= 10;
}
class EsquemaEvaluacion {
  constructor(periodos) {
    if (!Array.isArray(periodos)) throw new TypeError('Se requiere un arreglo de periodos.');
    this.periodos = periodos;
  }
  calcular(calificaciones) { return calcularPromedio(this.periodos, calificaciones); }
}
module.exports = { calcularPromedio, notaValida, EsquemaEvaluacion };
