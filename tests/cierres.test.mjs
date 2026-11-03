import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretarResumenCierre, mensajeErrorCierre } from '../app/utils/cierres.mjs';

const fecha = '2026-10-30';
const respuesta = extra => ({
  fecha: { aportes: '5000', gastos: '1000', utilidades: '0', recaudos: '3000', ventas: '2000', count_recaudos: 2, count_ventas: 1 },
  validacion_cierre: { fecha, tienda_id: 12, hoy: '2026-11-02', puede_registrar: true, codigo: 'sin_movimientos_posteriores', mensaje: 'Puedes cerrar esta fecha.', saldo_a_registrar: '10000', cierre_existente: null, ...extra },
});

test('lunes permite viernes con el saldo verificado por el servidor, sin límite de ayer', () => {
  const r = interpretarResumenCierre(respuesta(), fecha, 12);
  assert.equal(r.validacion.puede_registrar, true);
  assert.equal(r.estado_saldo, 'pendiente');
  assert.equal(r.saldo_cierre, 10000);
  assert.equal(r.recaudos, 3000);
});

test('respuestas de otra fecha o ruta nunca habilitan el cierre actual', () => {
  assert.throws(() => interpretarResumenCierre(respuesta(), '2026-10-31', 12), /verificar/);
  assert.throws(() => interpretarResumenCierre(respuesta(), fecha, 13), /verificar/);
});

test('no interpreta una respuesta antigua o incompleta como ausencia de movimientos', () => {
  assert.throws(() => interpretarResumenCierre({ fecha: respuesta().fecha, hoy: { tiene_movimientos: false } }, fecha, 12), /verificar/);
  assert.throws(() => interpretarResumenCierre({ ...respuesta(), fecha: {} }, fecha, 12), /verificar/);
  for (const valor of [null, undefined, false, '', '   ', 'no es un saldo']) {
    assert.throws(() => interpretarResumenCierre(respuesta({ saldo_a_registrar: valor }), fecha, 12), /verificar/);
  }
});

test('bloqueos por actividad posterior, historial, permisos o futuro no muestran un saldo histórico supuesto', () => {
  for (const codigo of ['movimientos_posteriores', 'historial_insuficiente', 'saldo_sin_respaldo', 'solo_hoy_trabajador', 'fecha_futura', 'fecha_anterior_ruta']) {
    const r = interpretarResumenCierre(respuesta({ puede_registrar: false, codigo, mensaje: 'Motivo del servidor', saldo_a_registrar: null }), fecha, 12);
    assert.equal(r.validacion.puede_registrar, false);
    assert.equal(r.saldo_cierre, null);
    assert.equal(r.estado_saldo, 'sin_registro');
  }
});

test('un cierre existente muestra su fotografía original y nunca ofrece otro registro', () => {
  const r = interpretarResumenCierre(respuesta({ puede_registrar: false, codigo: 'cierre_existente', saldo_a_registrar: null,
    cierre_existente: { id: 1, fecha_cierre: fecha, valor: '8500' } }), fecha, 12);
  assert.equal(r.saldo_cierre, 8500);
  assert.equal(r.estado_saldo, 'registrado');
  assert.equal(r.validacion.puede_registrar, false);
});

test('caja cero o negativa son valores reales y no una consulta fallida', () => {
  for (const saldo of ['0', '-500']) assert.equal(interpretarResumenCierre(respuesta({ saldo_a_registrar: saldo }), fecha, 12).saldo_cierre, Number(saldo));
});

test('una respuesta HTML del modo sin conexión o una falla de red muestra ayuda clara', () => {
  for (const error of [new SyntaxError("Unexpected token <"), new TypeError('Failed to fetch'), { name: 'AbortError' }]) {
    assert.equal(mensajeErrorCierre(error), 'No se pudo verificar el cierre. Actualiza antes de registrar.');
  }
  assert.equal(mensajeErrorCierre(new Error('No tienes acceso a esta ruta.')), 'No tienes acceso a esta ruta.');
});
