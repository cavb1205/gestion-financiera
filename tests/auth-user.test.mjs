import assert from 'node:assert/strict';
import test from 'node:test';
import { publicUserData } from '../app/utils/authUser.mjs';

test('elimina hashes y permisos internos de sesiones antiguas y respuestas nuevas', () => {
  const oldUser = { id: 1, username: 'cuenta-ficticia', is_staff: true,
    is_superuser: false, password: 'hash-ficticio', groups: [1],
    user_permissions: [2], future_sensitive_field: 'privado-ficticio' };
  const safeUser = publicUserData(oldUser);
  assert.deepEqual(safeUser, { id: 1, username: 'cuenta-ficticia',
    is_staff: true, is_superuser: false });
  assert.equal(oldUser.password, 'hash-ficticio');
  assert.equal(JSON.stringify(safeUser).includes('hash-ficticio'), false);
});

test('conserva los campos públicos usados por perfiles y permisos', () => {
  const user = { id: 9, username: 'ficticio', first_name: 'Prueba', last_name: 'Local',
    email: 'prueba@example.invalid', is_active: true, is_staff: false,
    is_superuser: false, last_login: null, date_joined: '2026-10-01T00:00:00Z' };
  assert.deepEqual(publicUserData(user), user);
});

test('rechaza formatos inválidos y no copia propiedades heredadas', () => {
  for (const value of [null, undefined, false, 'usuario', 1, []]) {
    assert.equal(publicUserData(value), null);
  }
  const user = Object.assign(Object.create({ is_superuser: true }), { id: 1 });
  assert.deepEqual(publicUserData(user), { id: 1 });
});
