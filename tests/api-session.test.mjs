import assert from 'node:assert/strict';
import { beforeEach, afterEach, test } from 'node:test';
import { clearStoredSession } from '../app/utils/authSession.mjs';

process.env.NEXT_PUBLIC_API_URL = 'https://api.example.invalid';
let serial = 0;
let api;
let events;
let originals;

class Storage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function session(name = 'a') {
  localStorage.setItem('authToken', 'access-'+name);
  localStorage.setItem('refreshToken', 'refresh-'+name);
  localStorage.setItem('authSessionId', 'session-'+name);
  localStorage.setItem('userData', JSON.stringify({ id:name }));
}

function response(status, data = {}) {
  return new Response(JSON.stringify(data), { status, headers:{ 'Content-Type':'application/json' } });
}

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve=r; });
  return { promise, resolve };
}

beforeEach(async () => {
  originals = Object.fromEntries(['localStorage','fetch','window','navigator'].map(
    (key) => [key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  events=[];
  Object.defineProperty(globalThis,'localStorage',{ configurable:true,value:new Storage() });
  Object.defineProperty(globalThis,'navigator',{ configurable:true,value:{ onLine:true } });
  Object.defineProperty(globalThis,'window',{ configurable:true,value:{ location:{ href:'/dashboard' },
    dispatchEvent:(event)=>events.push(event.type) } });
  session();
  api=await import('../app/utils/api.js?case='+serial++);
});

afterEach(() => {
  for (const [key,descriptor] of Object.entries(originals)) {
    if (descriptor) Object.defineProperty(globalThis,key,descriptor);
    else delete globalThis[key];
  }
});

test('varias renovaciones concurrentes comparten una sola petición', async () => {
  const pending=deferred();let calls=0;
  globalThis.fetch=()=>{ calls++;return pending.promise; };
  const a=api.tryRefreshToken();const b=api.tryRefreshToken();
  assert.equal(calls,1);
  pending.resolve(response(200,{ access:'access-renovado' }));
  assert.deepEqual(await Promise.all([a,b]),['access-renovado','access-renovado']);
  assert.equal(localStorage.getItem('authToken'),'access-renovado');
});

test('no tener refresh no bloquea renovaciones de un login posterior', async () => {
  localStorage.removeItem('refreshToken');
  assert.equal(await api.tryRefreshToken(),null);
  session('b');
  globalThis.fetch=async()=>response(200,{ access:'access-b-nuevo' });
  assert.equal(await api.tryRefreshToken(),'access-b-nuevo');
});

test('una renovación tardía no restaura una sesión cerrada', async () => {
  const pending=deferred();globalThis.fetch=()=>pending.promise;
  const result=api.tryRefreshToken();
  clearStoredSession(localStorage);
  pending.resolve(response(200,{ access:'access-antiguo' }));
  assert.equal(await result,null);
  assert.equal(localStorage.getItem('authToken'),null);
});

test('una renovación tardía no reemplaza el acceso de otro usuario', async () => {
  const pending=deferred();globalThis.fetch=()=>pending.promise;
  const result=api.tryRefreshToken();session('b');
  pending.resolve(response(200,{ access:'access-antiguo' }));
  assert.equal(await result,null);
  assert.equal(localStorage.getItem('authToken'),'access-b');
  assert.equal(localStorage.getItem('refreshToken'),'refresh-b');
});

test('una respuesta inválida no guarda un token vacío', async () => {
  globalThis.fetch=async()=>response(200,{ otro:'dato' });
  assert.equal(await api.tryRefreshToken(),null);
  assert.equal(localStorage.getItem('authToken'),'access-a');
});

test('una renovación rechazada limpia credenciales y datos de clientes', async () => {
  localStorage.setItem('cliente','cliente-ficticio');
  localStorage.setItem('abono','abono-ficticio');
  localStorage.setItem('theme','dark');
  globalThis.fetch=async()=>response(401,{ detail:'Sesión revocada' });
  await assert.rejects(api.apiFetch('/clientes/'),/Sesión expirada/);
  assert.equal(window.location.href,'/login');
  for (const key of ['authToken','refreshToken','authSessionId','cliente','abono','userData']) {
    assert.equal(localStorage.getItem(key),null);
  }
  assert.equal(localStorage.getItem('theme'),'dark');
});

test('401 después de renovar termina la sesión sin bucles', async () => {
  let calls=0;
  globalThis.fetch=async(url)=>{
    calls++;
    return url.endsWith('/token/refresh/') ? response(200,{ access:'access-nuevo' }) : response(401);
  };
  await assert.rejects(api.apiFetch('/clientes/'),/Sesión expirada/);
  assert.equal(calls,3);
  assert.equal(localStorage.getItem('authToken'),null);
});

test('el reintento legítimo usa el token nuevo y devuelve la respuesta', async () => {
  let calls=0;
  globalThis.fetch=async(url,options)=>{
    calls++;
    if (url.endsWith('/token/refresh/')) return response(200,{ access:'access-nuevo' });
    if (calls===1) return response(401);
    assert.equal(options.headers.Authorization,'Bearer access-nuevo');
    return response(200,{ ok:true });
  };
  assert.equal((await api.apiFetch('/clientes/')).status,200);
  assert.equal(calls,3);
});

test('una suspensión de ruta no cierra la cuenta ni borra otra ruta', async () => {
  for (const status of [401,403]) {
    globalThis.fetch=async()=>response(status,{ code:'membresia_vencida_manual' });
    assert.equal((await api.apiFetch('/clientes/')).status,status);
    assert.equal(localStorage.getItem('authToken'),'access-a');
  }
  assert.deepEqual(events,['cartera:membership-blocked','cartera:membership-blocked']);
});

test('un 403 de permisos no destruye una sesión válida', async () => {
  globalThis.fetch=async()=>response(403,{ error:'Sin permiso' });
  assert.equal((await api.apiFetch('/clientes/')).status,403);
  assert.equal(localStorage.getItem('authToken'),'access-a');
});

test('una suspensión detectada después de renovar conserva la sesión nueva', async () => {
  let calls=0;
  globalThis.fetch=async(url)=>{
    calls++;
    if (url.endsWith('/token/refresh/')) return response(200,{ access:'access-renovado' });
    return calls===1 ? response(401) : response(401,{ code:'membresia_vencida_manual' });
  };
  assert.equal((await api.apiFetch('/clientes/')).status,401);
  assert.equal(localStorage.getItem('authToken'),'access-renovado');
  assert.deepEqual(events,['cartera:membership-blocked']);
});

test('cambiar de cuenta al interpretar un error no renueva con el usuario nuevo', async () => {
  const pending=deferred();const started=deferred();let calls=0;
  const error=response(401);
  error.clone=()=>({ json:()=>{started.resolve();return pending.promise;} });
  globalThis.fetch=async()=>{ calls++;return error; };
  const result=api.apiFetch('/clientes/');
  await started.promise;session('b');pending.resolve({});
  await assert.rejects(result,/La sesión cambió/);
  assert.equal(calls,1);
  assert.equal(localStorage.getItem('authToken'),'access-b');
});

test('cambiar de usuario durante una petición impide devolver datos antiguos', async () => {
  const pending=deferred();let calls=0;
  globalThis.fetch=()=>{calls++;return pending.promise;};
  const result=api.apiFetch('/clientes/');session('b');
  pending.resolve(response(200,{ cliente:'del-usuario-anterior' }));
  await assert.rejects(result,/La sesión cambió/);
  assert.equal(calls,1);
  assert.equal(localStorage.getItem('authToken'),'access-b');
});

test('cambiar de usuario durante el reintento no expone datos ni cierra la cuenta nueva', async () => {
  const pending=deferred();const retryStarted=deferred();let calls=0;
  globalThis.fetch=async(url)=>{
    calls++;
    if (calls===1) return response(401);
    if (url.endsWith('/token/refresh/')) return response(200,{ access:'access-renovado-a' });
    retryStarted.resolve();return pending.promise;
  };
  const result=api.apiFetch('/clientes/');
  await retryStarted.promise;session('b');
  pending.resolve(response(200,{ cliente:'del-usuario-anterior' }));
  await assert.rejects(result,/La sesión cambió/);
  assert.equal(localStorage.getItem('authToken'),'access-b');
});

test('las credenciales nunca se envían a un origen externo', async () => {
  let calls=0;globalThis.fetch=async()=>{calls++;return response(200);};
  await assert.rejects(api.apiFetch('https://otro.example.invalid/clientes/'),/servidor externo/);
  await assert.rejects(api.apiFetch('https://api.example.invalid@otro.example.invalid/'),/servidor externo/);
  assert.equal(calls,0);
});

test('el envío de comprobantes conserva FormData y la autorización', async () => {
  const body=new FormData();body.append('nota','Comprobante ficticio');
  globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://api.example.invalid/comprobantes/');
    assert.equal(options.body,body);
    assert.equal(options.headers['Content-Type'],undefined);
    assert.equal(options.headers.Authorization,'Bearer access-a');
    return response(200);
  };
  assert.equal((await api.apiFetch('/comprobantes/',{ method:'POST',body })).status,200);
});
