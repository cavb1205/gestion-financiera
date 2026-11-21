import test from 'node:test';
import assert from 'node:assert/strict';
import { construirCsp, origenApi } from '../app/utils/csp.mjs';

const directivas = (csp) => Object.fromEntries(csp.split('; ').map((d) => {
  const [k, ...v] = d.split(' ');
  return [k, v];
}));

test('producción: solo la API y orígenes conocidos', () => {
  const d = directivas(construirCsp({ apiUrl: 'https://api.carterafinanciera.com/' }));
  assert.deepEqual(d['connect-src'], ["'self'", 'https://api.carterafinanciera.com']);
  assert.ok(!d['script-src'].includes("'unsafe-eval'"));
  assert.ok(!d['script-src'].some((s) => s.startsWith('http')));
  assert.deepEqual(d['object-src'], ["'none'"]);
  assert.deepEqual(d['frame-ancestors'], ["'none'"]);
  assert.ok(d['img-src'].includes('https://*.tile.openstreetmap.org'));
  assert.ok(d['img-src'].includes('blob:'));
  assert.ok('upgrade-insecure-requests' in d);
});

test('desarrollo permite eval y websockets de recarga', () => {
  const d = directivas(construirCsp({ apiUrl: 'http://localhost:8000', dev: true }));
  assert.ok(d['script-src'].includes("'unsafe-eval'"));
  assert.ok(d['connect-src'].includes('http://localhost:8000'));
  assert.ok(!('upgrade-insecure-requests' in d));
});

test('URL de API inválida no rompe la política', () => {
  assert.equal(origenApi('no es url'), null);
  assert.deepEqual(directivas(construirCsp({ apiUrl: undefined }))['connect-src'], ["'self'"]);
});
