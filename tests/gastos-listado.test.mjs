import test from 'node:test';
import assert from 'node:assert/strict';
import { consultaGastos, leerPaginaGastos } from '../app/utils/gastosListado.mjs';

test('consulta con y sin filtros', () => {
  assert.equal(consultaGastos(), '?page=1&limit=10');
  assert.equal(consultaGastos({ pagina: 3, limite: 25, filtros: { fechaInicio: '2026-10-01', fechaFin: '2026-10-31', tipoGasto: '7' } }),
    '?page=3&limit=25&desde=2026-10-01&hasta=2026-10-31&tipo=7');
  assert.equal(consultaGastos({ filtros: { fechaInicio: '', fechaFin: '', tipoGasto: 'Todos' } }), '?page=1&limit=10');
});

test('lee la página y los totales del filtro', () => {
  const r = leerPaginaGastos({ resultados: [{ id: 1 }], total_registros: 31, total_monto: '15000.50', pagina: 2, paginas: 4, limite: 10 });
  assert.deepEqual(r, { gastos: [{ id: 1 }], totalRegistros: 31, totalMonto: 15000.5, paginas: 4, pagina: 2 });
  assert.equal(leerPaginaGastos({ resultados: [], total_registros: 0, total_monto: '0.00', pagina: 1, paginas: 1 }).paginas, 1);
});

test('respuestas inválidas o del formato antiguo fallan claro', () => {
  for (const malo of [null, [], { message: 'No se han creado gastos' }, { resultados: [], total_registros: '3', pagina: 1, paginas: 1 }]) {
    assert.throws(() => leerPaginaGastos(malo), /listado de gastos inválido/);
  }
});
