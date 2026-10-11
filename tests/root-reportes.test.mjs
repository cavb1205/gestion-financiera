import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesRootSearch, csvCell, csvDocument, isRootNavigationActive } from '../app/utils/rootReports.mjs';

test('Búsqueda por nombre, usuario, ID y código; insensible a acentos', () => {
  assert.equal(matchesRootSearch('camilo', ['Cámilo Pérez']), true);
  assert.equal(matchesRootSearch('@admin', ['admin-pruebas']), true);
  assert.equal(matchesRootSearch('901', [null, 901]), true);
  assert.equal(matchesRootSearch('mm-abc', ['MM-ABC']), true);
  assert.equal(matchesRootSearch('', []), true);
  assert.equal(matchesRootSearch('nadie', [undefined, 901]), false);
});
test('CSV escapa comillas, saltos y fórmulas externas', () => {
  assert.equal(csvCell('Ruta "A", B'), '"Ruta ""A"", B"');
  for (const text of ['=1+1', '+SUM(A1)', '-1+2', '@SUM(A1)', '  =1', '\t1', '\n=1']) assert.ok(csvCell(text).startsWith('"\''));
  assert.equal(csvCell(12000), '"12000"');
  assert.equal(csvDocument(['Ruta'], [['A\nB']]), '\uFEFF"Ruta"\r\n"A\nB"');
});
test('Panel root no se activa en secciones hijas ni prefijos parecidos', () => {
  assert.equal(isRootNavigationActive('/dashboard/admin/rutas', '/dashboard/admin'), false);
  assert.equal(isRootNavigationActive('/dashboard/admin', '/dashboard/admin'), true);
  assert.equal(isRootNavigationActive('/dashboard/admin/rutas/901', '/dashboard/admin/rutas'), true);
  assert.equal(isRootNavigationActive('/dashboard/admin/rutas2', '/dashboard/admin/rutas'), false);
});
