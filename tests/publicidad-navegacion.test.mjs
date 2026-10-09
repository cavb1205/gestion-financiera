import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import nextConfig from '../next.config.mjs';

const read = relative => readFileSync(new URL('../' + relative, import.meta.url), 'utf8');
const legacy = '/dashboard/reportes/publicidad';
const destination = '/dashboard/publicidad';

test('los enlaces antiguos tienen una redirección permanente a la sección única', async () => {
  const redirects = await nextConfig.redirects();
  assert.deepEqual(redirects.filter(rule => rule.source === legacy), [
    { source: legacy, destination, permanent: true },
  ]);
  assert.ok(redirects.every(rule => rule.source !== destination));
});

test('el menú compartido de escritorio y móvil mantiene solo Publicidad', () => {
  const layout = read('app/dashboard/layout.js');
  assert.ok(!layout.includes(legacy));
  assert.match(layout, /path: '\/dashboard\/publicidad', label: 'Publicidad'/);
  assert.match(layout, /label: 'Reportes'/);
  assert.match(layout, /\/dashboard\/reportes\/ubicaciones/);
});

test('el buscador global mantiene una sola opción de Publicidad para ambos roles', () => {
  const search = read('app/components/GlobalSearch.js');
  assert.ok(!search.includes(legacy));
  assert.match(search, /label: "Publicidad", path: "\/dashboard\/publicidad", icon: FiMapPin \}/);
});

test('Publicidad conserva mapa, lista y filtros sin un enlace circular al reporte', () => {
  const page = read('app/dashboard/publicidad/page.js');
  assert.ok(!page.includes(legacy));
  assert.ok(!page.includes('Abrir reporte de publicidad'));
  for (const retained of ['Mapa del equipo', 'Entregas registradas', 'Solo mis registros',
                         'Buscar publicidad', 'Responsable', '/publicidad/rango/',
                         'Registrar entrega aquí']) {
    assert.ok(page.includes(retained), retained);
  }
});

test('la guía dirige todo el seguimiento a Publicidad', () => {
  const guide = read('app/guia-rapida/page.js');
  assert.ok(!guide.includes('«Reportes» → «Mapa de Publicidad»'));
  assert.ok(guide.includes('Todo el seguimiento está en «Publicidad»'));
  assert.ok(guide.includes('href: "/dashboard/publicidad"'));
});

test('la pantalla duplicada no se compila ni consulta la API', () => {
  assert.equal(existsSync(new URL('../app/dashboard/reportes/publicidad/page.js', import.meta.url)), false);
});
