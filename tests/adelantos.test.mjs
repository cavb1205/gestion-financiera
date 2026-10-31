import test from 'node:test';
import assert from 'node:assert/strict';
import { etiquetaCuotasAdelantadas } from '../app/utils/adelantos.mjs';

const semanal = (anticipo, extra = {}) => ({
  plazo: 'Semanal', estado_venta: 'Vigente', dias_atrasados: '0.00',
  total_a_pagar: '120000', cuotas: 4, valor_cuota: '30000',
  calendario_pago: { estado: 'Vigente', anticipo }, ...extra,
});

test('el calendario muestra dos cuotas adelantadas aunque el atraso sea cero', () => {
  assert.equal(etiquetaCuotasAdelantadas(semanal('60000')), '2 cuotas adelantadas');
});
test('reconoce una cuota y anticipos parciales sin redondear a cuotas enteras', () => {
  assert.equal(etiquetaCuotasAdelantadas(semanal('30000')), '1 cuota adelantada');
  assert.equal(etiquetaCuotasAdelantadas(semanal('15000')), '0,5 cuotas adelantadas');
  assert.equal(etiquetaCuotasAdelantadas(semanal('75000')), '2,5 cuotas adelantadas');
  assert.equal(etiquetaCuotasAdelantadas(semanal('1')), 'Menos de 0,01 cuotas adelantadas');
});
test('mensual expresa cuotas en vez de convertir un mes a días fijos', () => {
  assert.equal(etiquetaCuotasAdelantadas(semanal('60000', { plazo: 'Mensual', cuotas: 1 })), '0,5 cuotas adelantadas');
});
test('el anticipo del calendario prevalece sobre un atraso negativo histórico', () => {
  assert.equal(etiquetaCuotasAdelantadas(semanal('0', { dias_atrasados: -3 })), '');
  assert.equal(etiquetaCuotasAdelantadas(semanal('15000', { dias_atrasados: -3 })), '0,5 cuotas adelantadas');
});
test('diario conserva adelantos enteros y fraccionarios del contrato histórico', () => {
  for (const [dias_atrasados, expected] of [[-2, '2 cuotas adelantadas'], ['-0.25', '0,25 cuotas adelantadas'], [0, ''], [2, '']])
    assert.equal(etiquetaCuotasAdelantadas({ plazo: 'Diario', estado_venta: 'Vigente', dias_atrasados }), expected);
});
test('no muestra adelantos para créditos cerrados o datos inválidos', () => {
  for (const estado_venta of ['Pagado', 'Perdida']) assert.equal(etiquetaCuotasAdelantadas(semanal('60000', { estado_venta })), '');
  assert.equal(etiquetaCuotasAdelantadas(semanal('60000', { calendario_pago: { estado: 'Pagado', anticipo: '60000' } })), '');
  for (const anticipo of [undefined, '', 'inválido', -1, Infinity]) assert.equal(etiquetaCuotasAdelantadas(semanal(anticipo)), '');
  assert.equal(etiquetaCuotasAdelantadas(semanal('60000', { cuotas: 0, valor_cuota: 0 })), '');
  assert.equal(etiquetaCuotasAdelantadas(null), '');
});
test('usa la cuota contractual sin redondear antes de convertir el anticipo', () => {
  assert.equal(etiquetaCuotasAdelantadas(semanal('100', { total_a_pagar: 100, cuotas: 3, valor_cuota: 33 })), '3 cuotas adelantadas');
});
test('la etiqueta no modifica la información financiera recibida', () => {
  const credito = semanal('15000'); const before = structuredClone(credito);
  etiquetaCuotasAdelantadas(credito);
  assert.deepEqual(credito, before);
});
