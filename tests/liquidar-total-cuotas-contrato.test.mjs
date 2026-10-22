import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Liquidar pide y usa la base contractual, no pendiente + cobrado', () => {
  const source = readFileSync(new URL('../app/dashboard/liquidar/page.js', import.meta.url), 'utf8');
  assert.match(source, /\?resumen=1/);
  assert.match(source, /leerLiquidacion\(creditosData, selectedDate, vistaPrevia\)/);
  assert.match(source, /setBaseCuotasDia\(liquidacion\.totalACobrar\)/);
  assert.match(source, /const totalRecaudar = .*baseCuotasDia : 0/);
  assert.doesNotMatch(source, /const totalRecaudar = .*importePendiente.*totalRealizados/);
  assert.match(source, /resumirLiquidacion\(filteredCreditos\)\.importePendiente/);
  assert.doesNotMatch(source, /Los anticipos siguen visibles/);
});

test('Liquidar mantiene una sola lista y no duplica el acceso a Recaudos', () => {
  const source = readFileSync(new URL('../app/dashboard/liquidar/page.js', import.meta.url), 'utf8');
  assert.match(source, /creditosParaLiquidar\(filteredCreditos, vistaPrevia\)/);
  assert.doesNotMatch(source, /vistaGestion|Estado del recorrido|Gestionados|Ver clientes con abono o falla/);
  assert.doesNotMatch(source, /href=[^\n]*dashboard\/recaudos/);
  assert.match(source, /resumirLiquidacion\(filteredCreditos\)\.importePendiente/);
});
