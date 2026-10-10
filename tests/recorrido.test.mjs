import test from 'node:test';
import assert from 'node:assert/strict';
import { moverCliente, mismoOrden, ordenarCreditosRecorrido, textoRecorrido, validarRecorrido } from '../app/utils/recorrido.js';
const clientes = Array.from({ length: 75 }, (_, i) => ({ id:i+1, nombres:`Cliente ${i+1}` }));
const ids = lista => lista.map(c => c.id);

test('mover al inicio sin mutar la lista original', () => {
  const copia = JSON.stringify(clientes);
  const resultado = moverCliente(clientes,70,'inicio');
  assert.deepEqual(ids(resultado).slice(0,4),[70,1,2,3]);
  assert.equal(JSON.stringify(clientes),copia);
  assert.equal(new Set(ids(resultado)).size,75);
});
test('subir/bajar operan sobre el recorrido completo, no sobre el filtro', () => {
  assert.deepEqual(ids(moverCliente(clientes,3,'subir')).slice(0,4),[1,3,2,4]);
  assert.deepEqual(ids(moverCliente(clientes,3,'bajar')).slice(0,5),[1,2,4,3,5]);
  assert.equal(moverCliente(clientes,1,'subir'),clientes);
  assert.equal(moverCliente(clientes,75,'bajar'),clientes);
});
test('antes/después en ambas direcciones y entre páginas', () => {
  assert.deepEqual(ids(moverCliente(clientes,70,'antes',8)).slice(5,10),[6,7,70,8,9]);
  assert.deepEqual(ids(moverCliente(clientes,70,'despues',8)).slice(5,10),[6,7,8,70,9]);
  assert.deepEqual(ids(moverCliente(clientes,2,'antes',5)).slice(0,5),[1,3,4,2,5]);
  assert.deepEqual(ids(moverCliente(clientes,2,'despues',5)).slice(0,5),[1,3,4,5,2]);
});
test('movimientos inválidos no pierden clientes', () => {
  for (const args of [[70,'antes',70],[70,'despues',999],[999,'inicio'],[1,'desconocido']]) assert.equal(moverCliente(clientes,...args),clientes);
});
test('el orden no filtra créditos ni cambia importes; mismo cliente adyacente', () => {
  const creditos = [{id:1,cliente:{id:1},valor_cuota:50},{id:2,cliente:{id:3},valor_cuota:100},
    {id:3,cliente:{id:1},valor_cuota:80},{id:4,cliente:{id:75},valor_cuota:30}];
  const copia = JSON.stringify(creditos);
  const resultado = ordenarCreditosRecorrido(creditos,{configurado:true,clientes:[clientes[2],clientes[0]]});
  assert.deepEqual(ids(resultado),[2,1,3,4]);
  assert.deepEqual(new Set(resultado),new Set(creditos));
  assert.equal(resultado.reduce((s,c)=>s+c.valor_cuota,0),260);
  assert.equal(JSON.stringify(creditos),copia);
  assert.equal(ordenarCreditosRecorrido(creditos,{configurado:false,clientes:[]}),creditos);
});
test('buscar tolera tildes y espacios', () => {
  assert.equal(textoRecorrido('  María MUÑOZ  '),'maria munoz');
});
test('comparar posiciones y validar contrato por ruta', () => {
  const documento = {tienda:10,configurado:true,version:1,clientes};
  assert.equal(validarRecorrido(documento,10),documento);
  assert(mismoOrden(clientes,[...clientes]));
  assert(!mismoOrden(clientes,moverCliente(clientes,3,'inicio')));
  for (const data of [{...documento,tienda:11},{...documento,version:-1},
    {...documento,clientes:[clientes[0],clientes[0]]},{...documento,clientes:[{id:true}]}]) assert.throws(()=>validarRecorrido(data,10));
});
