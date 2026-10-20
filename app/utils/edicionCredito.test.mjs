import test from 'node:test';
import assert from 'node:assert/strict';
import { cambiarModalidad, versionPlanEdicion, resumenPlanEdicion, validarEdicion } from './edicionCredito.mjs';

test('solo cambiar modalidad propone cuotas; no reescribe el formulario inicial', () => {
  const original = { plazo: 'Diario', cuotas: 13, valor_venta: 1000000, interes: 20 };
  assert.equal(cambiarModalidad(original, 'Diario'), original);
  assert.equal(cambiarModalidad(original, 'No valido'), original);
  for (const [plazo,cuotas] of [['Semanal',4],['Mensual',1]]) {
    assert.deepEqual(cambiarModalidad(original,plazo),{...original,plazo,cuotas});
  }
  assert.equal(cambiarModalidad({plazo:'Semanal',cuotas:6},'Diario').cuotas,20);
  assert.equal(original.cuotas,13);
});

test('calendario moderno solo en cambios explícitos de modalidad', () => {
  assert.equal(versionPlanEdicion({plazo:'Mensual',calendario_version:0},'Mensual'),0);
  assert.equal(versionPlanEdicion({plazo:'Diario',calendario_version:0},'Mensual'),1);
  assert.equal(versionPlanEdicion({plazo:'Mensual',calendario_version:1},'Diario'),0);
});

test('mensual calendario, histórico y año bisiesto coinciden con backend', () => {
  const parametros={fecha:'2026-01-31',plazo:'Mensual',cuotas:1};
  const moderno=resumenPlanEdicion({plazo:'Diario'},parametros);
  assert.equal(moderno.primera,'2026-02-28');
  assert.equal(moderno.vencimiento,'2026-02-28');
  const historico=resumenPlanEdicion({plazo:'Mensual',calendario_version:0},parametros);
  assert.equal(historico.primera,'2026-03-02');
  assert.equal(historico.vencimiento,'2026-03-06');
  assert.equal(resumenPlanEdicion({plazo:'Diario'},{...parametros,fecha:'2024-01-31'}).primera,'2024-02-29');
});

test('semanal y diario distinguen última cuota y vencimiento histórico', () => {
  const semanal=resumenPlanEdicion({plazo:'Diario'},{fecha:'2026-10-08',plazo:'Semanal',cuotas:4});
  assert.deepEqual(semanal.fechas,['2026-10-15','2026-10-22','2026-10-29','2026-11-05']);
  assert.equal(semanal.vencimiento,'2026-11-05');
  const diario=resumenPlanEdicion({plazo:'Semanal'},{fecha:'2026-10-08',plazo:'Diario',cuotas:20});
  assert.equal(diario.ultima,'2026-10-28');
  assert.equal(diario.vencimiento,'2026-11-01');
});

test('fechas y cantidades inválidas no presentan un plan engañoso', () => {
  for (const extra of [{fecha:''},{fecha:'2026-02-30'},{cuotas:0},{cuotas:121},{cuotas:1.5}]) {
    assert.equal(resumenPlanEdicion({plazo:'Diario'},{fecha:'2026-01-31',plazo:'Mensual',cuotas:1,...extra}),null);
  }
});

test('ruta e historial deben estar verificados antes de permitir edición', () => {
  const venta={id:1,cliente:{id:1},tienda:9,plazo:'Diario',fecha_venta:'2026-10-08'};
  assert.equal(validarEdicion(venta,{count:0},'9'),false);
  assert.equal(validarEdicion(venta,{count:1},9),true);
  assert.throws(()=>validarEdicion(venta,{count:0},10),/ruta/);
  assert.throws(()=>validarEdicion(venta,{count:0},9,2),/crédito/);
  assert.throws(()=>validarEdicion({...venta,fecha_venta:'2026-02-30'},{count:0},9),/fecha/);
  for (const count of [undefined,null,'0',-1,0.5]) assert.throws(()=>validarEdicion(venta,{count},9),/movimientos/);
});
