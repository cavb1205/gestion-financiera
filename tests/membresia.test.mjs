import test from 'node:test';
import assert from 'node:assert/strict';
import { textoTransferencia, faseRenovacion, estadoAcceso } from '../app/utils/membresia.mjs';

const texto = '00.000.000-0\nSERVICIOS DE PRUEBA\nBanco Ficticio\nCuenta Corriente\n000001';

test('copiar la cuenta conserva RUT, orden, saltos y ceros sin reformatearlos', () => {
  assert.equal(textoTransferencia({ datos_transferencia: texto, numero: 'cuenta anterior' }), texto);
});

test('las solicitudes históricas conservan sus cuatro datos originales sin inventar un RUT', () => {
  assert.equal(textoTransferencia({ titular: 'Titular original', banco: 'Banco original', tipo: 'Corriente', numero: '00123' }), 'Titular original\nBanco original\nCorriente\n00123');
  assert.equal(textoTransferencia(null), '');
  assert.equal(textoTransferencia({ titular: null, numero: 123 }), '');
});

test('una transferencia pendiente siempre se puede retomar', () => {
  assert.equal(faseRenovacion({ estado: 'pendiente' }), 'pagar');
  assert.equal(faseRenovacion(null), 'renovar');
});

test('un comprobante en revisión o validación nunca invita a generar otro pago', () => {
  for (const estado of ['pendiente_confirmacion', 'procesando', 'pre_aprobada']) {
    assert.equal(faseRenovacion({ estado }), 'revision');
  }
});

test('confirmación, rechazo y vencimiento mantienen un resultado explícito al volver', () => {
  for (const estado of ['aprobada', 'confirmada']) assert.equal(faseRenovacion({ estado }), 'confirmada');
  for (const estado of ['rechazada', 'expirada', 'cancelada']) assert.equal(faseRenovacion({ estado }), 'cerrada');
});

test('el acceso temporal se distingue de una renovación confirmada y respeta el límite', () => {
  const mem = { estado: 'Pre-activada', pre_activada_hasta: '2026-11-04', fecha_vencimiento: '2026-10-01' };
  assert.deepEqual(estadoAcceso(mem, '2026-11-04'), { label: 'Acceso temporal', tone: 'amber', blocked: false });
  assert.equal(estadoAcceso(mem, '2026-11-05').blocked, true);
  assert.equal(estadoAcceso({ ...mem, vencida_manualmente: true }, '2026-11-01').blocked, true);
});

test('la gracia ordinaria no concede acceso después de dos días ni confunde una fecha faltante', () => {
  const mem = { estado: 'Activa', fecha_vencimiento: '2026-11-01' };
  assert.equal(estadoAcceso(mem, '2026-11-01').label, 'Activa');
  assert.equal(estadoAcceso(mem, '2026-11-02').label, 'Pendiente de renovación');
  assert.equal(estadoAcceso(mem, '2026-11-03').blocked, true);
  assert.equal(estadoAcceso({}, '2026-11-01').blocked, true);
});
