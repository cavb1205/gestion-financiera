import test from 'node:test';
import assert from 'node:assert/strict';
import { createTextMatcher, clientSearchValues } from '../app/utils/text.js';
import { matchesRootSearch } from '../app/utils/rootReports.mjs';
import { selectClients } from '../app/dashboard/reportes/cartera/report-model.mjs';

const clients = [
  { id: 1, nombres: 'José Antonio', apellidos: 'Pérez Gómez', identificacion: 'AB123', nombre_local: 'Almacén El Sol', telefono_principal: '56911112222' },
  { id: 2, nombres: 'María', apellidos: 'Muñoz', identificacion: 456, telefono_opcional: 56933334444 },
  { id: 3, nombres: 'Pedro', apellidos: 'Gómez', nombre_local: null },
];
const find = query => clients.filter(client => createTextMatcher(query)(clientSearchValues(client))).map(client => client.id);

test('nombre y apellidos funcionan juntos, parciales y en distinto orden', () => {
  for (const query of ['JOSE PEREZ', 'josé pérez', 'perez jose', 'jose gom', 'José Antonio Pérez Gómez'])
    assert.deepEqual(find(query), [1], query);
});
test('ignora espacios extra, saltos, mayúsculas y tildes Unicode', () => {
  for (const query of ['  MARIA   MUÑOZ  ', 'maria\tmunoz', 'Mari\u0301a Mu\u006e\u0303oz'])
    assert.deepEqual(find(query), [2], query);
});
test('todas las palabras deben coincidir en un mismo registro', () => {
  assert.deepEqual(find('jose maria'), []);
  assert.deepEqual(find('pedro perez'), []);
  assert.deepEqual(find('gomez'), [1, 3]);
});
test('permite documento, local y ambos teléfonos sin exigir campos opcionales', () => {
  for (const query of ['ab123', 'ALMACEN SOL', '11112222']) assert.deepEqual(find(query), [1]);
  for (const query of ['456', '33334444']) assert.deepEqual(find(query), [2]);
  assert.deepEqual(find('undefined'), []);
  assert.deepEqual(find('null'), []);
});
test('vaciar el buscador restaura todos los registros y no muta los datos', () => {
  const before = structuredClone(clients);
  for (const query of ['', '   ', null]) assert.deepEqual(find(query), [1, 2, 3]);
  assert.deepEqual(clients, before);
});
test('recaudos admiten cliente, identificación, número de recibo y crédito', () => {
  const matches = q => createTextMatcher(q)([...clientSearchValues(clients[0]), 987, 654]);
  assert.equal(matches('jose perez'), true);
  assert.equal(matches('AB123'), true);
  assert.equal(matches('987'), true);
  assert.equal(matches('654'), true);
  assert.equal(matches('maria'), false);
});
test('cartera encuentra al cliente aunque la página anterior exceda el resultado filtrado', () => {
  const rows = clients.map(client => ({ id: String(client.id), name: `${client.nombres} ${client.apellidos}`, identification: client.identificacion, rank: 1, level: 0, arrears: 0, flagged: 0, capital: 100, balance: 100 }));
  const result = selectClients(rows, { search: ' PEREZ   JOSE ', page: 7, size: 1 });
  assert.equal(result.current, 1);
  assert.equal(result.count, 1);
  assert.equal(result.items[0].id, '1');
});

test('administración mantiene búsqueda de usuarios con @ y tolera espacios múltiples', () => {
  assert.equal(matchesRootSearch('  @CAMILO   PEREZ ', ['Cámilo', 'Pérez']), true);
  assert.equal(matchesRootSearch('@nadie', ['Camilo']), false);
});
