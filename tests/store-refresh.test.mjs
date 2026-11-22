import test from 'node:test';
import assert from 'node:assert/strict';
import { esEscritura, refrescoReciente, registrarRefresco } from '../app/utils/storeRefresh.mjs';

test('escrituras invalidan; lecturas no', () => {
  for (const m of ['POST', 'put', 'PATCH', 'DELETE']) assert.equal(esEscritura(m), true, m);
  for (const m of [undefined, '', 'GET', 'head', 'OPTIONS']) assert.equal(esEscritura(m), false, String(m));
});

test('refresco completo reciente evita repetirlo; vence con maxAge', () => {
  const u = registrarRefresco(null, { id: 7, ahora: 1000 });
  assert.equal(refrescoReciente(u, { id: 7, maxAgeMs: 60000, ahora: 30000 }), true);
  assert.equal(refrescoReciente(u, { id: 7, maxAgeMs: 60000, ahora: 61001 }), false);
  assert.equal(refrescoReciente(u, { id: '7', membershipOnly: true, maxAgeMs: 30000, ahora: 20000 }), true);
});

test('membresía sola no cuenta como refresco completo', () => {
  const u = registrarRefresco(null, { id: 7, membershipOnly: true, ahora: 1000 });
  assert.equal(refrescoReciente(u, { id: 7, maxAgeMs: 60000, ahora: 2000 }), false);
  assert.equal(refrescoReciente(u, { id: 7, membershipOnly: true, maxAgeMs: 60000, ahora: 2000 }), true);
});

test('otra ruta, sin marca o sin maxAge siempre refresca', () => {
  const u = registrarRefresco(null, { id: 7, ahora: 1000 });
  assert.equal(refrescoReciente(u, { id: 8, maxAgeMs: 60000, ahora: 1001 }), false);
  assert.equal(refrescoReciente(null, { id: 7, maxAgeMs: 60000 }), false);
  assert.equal(refrescoReciente(u, { id: 7, ahora: 1001 }), false);
  assert.deepEqual(registrarRefresco(u, { id: 8, ahora: 5 }), { id: 8, completo: 5, membresia: 5 });
});
