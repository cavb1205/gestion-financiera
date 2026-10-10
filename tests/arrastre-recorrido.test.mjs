import test from 'node:test';
import assert from 'node:assert/strict';
import { destinoArrastre, velocidadArrastre } from '../app/utils/arrastreRecorrido.js';
import { moverCliente } from '../app/utils/recorrido.js';

const area = { left: 20, right: 300, top: 50, bottom: 400 };
const filas = [{ id: 1, top: 80, bottom: 180 }, { id: 4, top: 180, bottom: 280 }, { id: 7, top: 280, bottom: 380 }];
test('la mitad de la fila distingue antes/después; no se suelta sobre el propio cliente', () => {
  assert.deepEqual(destinoArrastre(filas, area, 100, 200, 1), { destinoId: 4, ubicacion: 'antes' });
  assert.deepEqual(destinoArrastre(filas, area, 100, 260, 1), { destinoId: 4, ubicacion: 'despues' });
  assert.equal(destinoArrastre(filas, area, 100, 120, 1), null);
});
test('fuera de la lista, sobre encabezado/footer o lista vacía cancela el movimiento', () => {
  for (const [x,y] of [[0,200],[301,200],[100,49],[100,401],[100,60],[100,390]]) {
    assert.equal(destinoArrastre(filas, area, x, y, 1), null);
  }
  assert.equal(destinoArrastre([],area,100,200,1),null);
});
test('un filtro solo determina la referencia, no pierde ni reordena los clientes ocultos entre sí', () => {
  const clientes = Array.from({length:8},(_,i)=>({id:i+1}));
  const copia = JSON.stringify(clientes);
  const {destinoId,ubicacion} = destinoArrastre(filas,area,100,350,1);
  const resultado = moverCliente(clientes,1,ubicacion,destinoId);
  assert.deepEqual(resultado.map(c=>c.id),[2,3,4,5,6,7,1,8]);
  assert.equal(JSON.stringify(clientes),copia);
  assert.equal(new Set(resultado.map(c=>c.id)).size,8);
});
test('autoscroll solo dentro del área: progresivo en los bordes, cero en el centro', () => {
  assert.equal(velocidadArrastre(area,100,50),-480);
  assert.equal(velocidadArrastre(area,100,74),-240);
  assert.equal(velocidadArrastre(area,100,200),0);
  assert.equal(velocidadArrastre(area,100,400),480);
  assert.equal(velocidadArrastre(area,100,376),240);
  assert.equal(velocidadArrastre(area,301,376),0);
  assert.equal(velocidadArrastre(area,100,410),0);
  assert.equal(velocidadArrastre({...area,bottom:50},100,50),0);
});
