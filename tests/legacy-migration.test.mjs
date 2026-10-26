import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { installationPlatform, migrationContinuation, migrationDestination, requestPwaInstall } from '../app/utils/legacyMigration.mjs';

test('migration destinations reject external URLs, encoded paths and unintended actions', () => {
  for (const value of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/dashboard/../login', '%2Fdashboard', '/dashboard?next=https://evil.invalid', '/dashboard#x', '/dashboard\n', '/dashboard/admin', '/dashboard/ventas/1/eliminar', null]) {
    assert.equal(migrationDestination(value), '/dashboard');
  }
  assert.equal(migrationDestination('/dashboard/ventas/123'), '/dashboard/ventas/123');
  assert.equal(migrationDestination('/dashboard/liquidar'), '/dashboard/liquidar');
});

test('transition respects login and route selection before continuing', () => {
  const base = { destination: '/dashboard/liquidar', selectedStore: { tienda: { id: 3 } } };
  assert.equal(migrationContinuation({ ...base, isAuthenticated: false }), '/login');
  assert.equal(migrationContinuation({ ...base, isAuthenticated: true, selectedStore: null }), '/select-store');
  assert.equal(migrationContinuation({ ...base, isAuthenticated: true }), '/dashboard/liquidar');
  assert.equal(migrationContinuation({ ...base, isAuthenticated: true, user: { username: 'root' } }), '/dashboard/admin');
  assert.equal(migrationContinuation({ ...base, isAuthenticated: false, destination: '/register' }), '/register');
});

test('installation instructions distinguish iOS, iPad desktop mode and Android', () => {
  assert.equal(installationPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'ios');
  assert.equal(installationPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 5), 'ios');
  assert.equal(installationPlatform('Mozilla/5.0 (Linux; Android 15)'), 'android');
  assert.equal(installationPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 0), 'other');
});

test('native install cancellation/failure retains a usable manual path', async () => {
  assert.equal(await requestPwaInstall(null), 'manual');
  assert.equal(await requestPwaInstall({ prompt: async () => { throw new Error('unavailable'); } }), 'manual');
  assert.equal(await requestPwaInstall({ prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) }), 'dismissed');
  let prompts = 0;
  assert.equal(await requestPwaInstall({ prompt: async () => { prompts++; }, userChoice: Promise.resolve({ outcome: 'accepted' }) }), 'accepted');
  assert.equal(prompts, 1);
});

test('the new manifest retains the existing installed app identity and dashboard launch', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.id, '/dashboard');
  assert.equal(manifest.start_url, '/dashboard');
  assert.equal(manifest.scope, '/');
  for (const [name,size] of [['icon-192.png',192],['icon-512.png',512],['apple-touch-icon.png',180]]) {
    const png = await readFile(new URL('../public/icons/'+name, import.meta.url));
    assert.deepEqual([...png.subarray(0,8)], [137,80,78,71,13,10,26,10]);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

test('every mapped Nginx destination is accepted by the new migration page', async () => {
  const config = await readFile(new URL('../ops/legacy-frontend/destinations.conf', import.meta.url), 'utf8');
  for (const line of config.split('\n')) {
    const match = line.match(/^\s+~\S+\s+(\/\S+);$/);
    if (!match) continue;
    const path = match[1].replace(/\$legacy_\w+/g,'123');
    assert.equal(migrationDestination(path), path);
  }
});
