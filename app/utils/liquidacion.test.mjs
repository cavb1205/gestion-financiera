import test from 'node:test';
import assert from 'node:assert/strict';
import { leerLiquidacion } from './liquidacion.js';

const fecha = '2026-10-15';
const respuesta = (extra = {}) => ({
  fecha_consulta: fecha, vista_previa: false, creditos: [],
  resumen_cobranza: { fecha_consulta: fecha, criterio: 'cuotas_del_dia', total_a_cobrar: '300000.00' },
  ...extra,
});

test('la base viene del servidor, aunque no queden créditos pendientes', () => {
  assert.deepEqual(leerLiquidacion(respuesta(), fecha, false), { creditos: [], totalACobrar: 300000 });
});
test('filas y pagos no reconstruyen ni inflan la base', () => {
  const data = respuesta({ creditos: [{ valor_cuota: 900000, total_abonado: 1200000 }] });
  assert.equal(leerLiquidacion(data, fecha, false).totalACobrar, 300000);
});
test('vista previa también usa solo cuotas de la fecha', () => {
  assert.equal(leerLiquidacion(respuesta({ vista_previa: true }), fecha, true).totalACobrar, 300000);
});
test('una ruta sin cuotas hoy tiene cero como base válido', () => {
  const data = respuesta(); data.resumen_cobranza.total_a_cobrar = '0.00';
  assert.equal(leerLiquidacion(data, fecha, false).totalACobrar, 0);
});
test('rechaza respuestas anteriores y resúmenes ausentes', () => {
  for (const data of [[], respuesta({ resumen_cobranza: undefined })]) {
    assert.throws(() => leerLiquidacion(data, fecha, false), /base de cuotas/);
  }
});
test('no confunde rutas/fechas ni modo real con proyección', () => {
  assert.throws(() => leerLiquidacion(respuesta(), '2026-10-16', false));
  assert.throws(() => leerLiquidacion(respuesta(), fecha, true));
  const data = respuesta(); data.resumen_cobranza.fecha_consulta = '2026-10-16';
  assert.throws(() => leerLiquidacion(data, fecha, false));
});
test('rechaza importes inválidos sin convertirlos silenciosamente en cero', () => {
  for (const monto of ['', null, true, [], 'NaN', 'Infinity', -1]) {
    const data = respuesta(); data.resumen_cobranza.total_a_cobrar = monto;
    assert.throws(() => leerLiquidacion(data, fecha, false));
  }
});
