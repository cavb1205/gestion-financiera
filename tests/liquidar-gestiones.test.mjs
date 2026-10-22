import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creditosParaLiquidar, etiquetaFalla } from '../app/utils/liquidacion.js';
import { permiteFalla, resumirLiquidacion } from '../app/utils/calendario.js';

test('La lista única retira abonos/visitas sin ocultar anticipos sin registro', () => {
  const datos = [
    { id: 1 },
    { id: 2, gestionado_hoy: true, falla_registrada_hoy: true },
    { id: 3, calendario_pago: { gestionado_hoy: true, permite_falla: true } },
    { id: 4, calendario_pago: { cobro_voluntario: true, gestionado_hoy: false } },
  ];
  const copy = structuredClone(datos);
  const lista = creditosParaLiquidar(datos);
  assert.deepEqual(lista.map(c => c.id), [1, 4]);
  assert.deepEqual(datos, copy);
  assert.equal(lista[0], datos[0]);
});

test('La falla duplicada se bloquea sin bloquear un nuevo abono o un crédito distinto', () => {
  for (const credito of [{ falla_registrada_hoy: true }, { calendario_pago: { falla_registrada_hoy: true, permite_falla: true } }]) {
    assert.equal(permiteFalla(credito), false);
    assert.equal(etiquetaFalla(credito, false), 'Falla ya registrada en esta fecha');
  }
  assert.equal(permiteFalla({ calendario_pago: { gestionado_hoy: true, permite_falla: true } }), true);
  assert.equal(permiteFalla({}), true);
  assert.equal(etiquetaFalla({}, true), 'Vista previa: falla no permitida');
});

test('La deuda de gestionados se conserva y el filtro de cliente usa ambos grupos', () => {
  const creditos = [
    { gestionado_hoy: true, falla_registrada_hoy: true, importe_pendiente_jornada: '300000.00' },
    { gestionado_hoy: false, importe_pendiente_jornada: '60000.00' },
    { gestionado_hoy: true, importe_pendiente_jornada: '0.00' },
  ];
  assert.equal(creditosParaLiquidar(creditos).length, 1);
  assert.equal(resumirLiquidacion(creditos).importePendiente, 360000);
  assert.equal(resumirLiquidacion(creditos.slice(0, 1)).importePendiente, 300000);
  assert.equal(resumirLiquidacion(creditos.slice(2)).importePendiente, 0);
});

test('El siguiente día queda por gestionar y las listas vacías son válidas', () => {
  assert.deepEqual(creditosParaLiquidar([]), []);
  assert.equal(creditosParaLiquidar([{ gestionado_hoy: false, falla_registrada_hoy: false }]).length, 1);
  assert.equal(permiteFalla({ falla_registrada_hoy: false, calendario_pago: { permite_falla: true } }), true);
});

test('La vista previa no inventa registros ni oculta créditos por actividad de hoy', () => {
  const creditos = [{ id: 1, gestionado_hoy: true }, { id: 2 }];
  assert.deepEqual(creditosParaLiquidar(creditos).map(c => c.id), [2]);
  assert.equal(creditosParaLiquidar(creditos, true), creditos);
});
