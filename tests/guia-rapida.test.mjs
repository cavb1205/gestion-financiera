import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../app/guia-rapida/page.js', import.meta.url), 'utf8');
// Los datos editoriales son JS sin JSX; se evalúan aislados, sin cargar React ni acceder a API.
const data = source.slice(source.indexOf('const GUIDE_VERSION'), source.indexOf('function RoleBadge'));
const icons = Object.fromEntries([...new Set(data.match(/\bFi[A-Z]\w+/g))].map(name => [name, () => null]));
const context = vm.createContext(icons);
vm.runInContext(data + '\nglobalThis.guide = { GUIDE_VERSION, GUIDE_UPDATED, ROLES, GUIDE_SECTIONS, FAQS };', context);
const { GUIDE_SECTIONS: sections, FAQS: faqs, ROLES: roles } = context.guide;
const byId = id => sections.find(section => section.id === id);
const text = section => JSON.stringify(section);

test('secciones únicas, roles válidos y enlaces a pantallas existentes', () => {
  assert.equal(sections.length, 16);
  assert.deepEqual(Array.from(sections, section => section.number), Array.from({length:16}, (_,i) => String(i+1).padStart(2,'0')));
  for (const key of ['id', 'number']) assert.equal(new Set(sections.map(section => section[key])).size, sections.length);
  for (const section of sections) {
    assert(roles[section.role], section.id);
    for (const key of ['title', 'description', 'href', 'note']) assert(section[key]?.trim(), `${section.id}: ${key}`);
    assert(existsSync(new URL(`../app${section.href}/page.js`, import.meta.url)), section.href);
    for (const [, , href] of section.reports || []) assert(existsSync(new URL(`../app${href}/page.js`, import.meta.url)), href);
  }
});

test('documenta calendario nuevo sin convertir contratos históricos', () => {
  const section = byId('nueva-venta');
  assert.equal(section.frequency.find(row => row[0] === 'Semanal')[1], '4');
  assert.equal(section.frequency.find(row => row[0] === 'Mensual')[1], '1');
  assert.match(text(section), /mes siguiente/);
  assert.match(section.note, /contratos antiguos/);
  assert.doesNotMatch(text(section), /cada 30 días|Atención desde/);
});

test('no confunde anticipos, deuda exigible, totales y consulta futura', () => {
  assert.match(text(byId('jornada')), /cobro voluntario/);
  assert.match(text(byId('jornada')), /Agregar pago/);
  assert.doesNotMatch(text(byId('jornada')), /desaparece de la lista/);
  const indicators = text(byId('indicadores-liquidar'));
  assert.match(indicators, /solo las cuotas correspondientes a la fecha seleccionada/);
  assert.match(indicators, /pagos del día, las fallas y los filtros no cambian esta base/);
  assert.match(indicators, /anticipos anteriores/);
  assert.doesNotMatch(indicators, /total descriptivo|pendiente exigible de la lista completa más/);
  assert.match(indicators, /todas las páginas/);
  assert.match(indicators, /no abonar, registrar fallas ni editar el recorrido/);
  const totalFaq = faqs.find(([question]) => question === 'Busco un cliente y el total del día no cambia')[1];
  assert.match(totalFaq, /base de cuotas de la fecha/);
  assert.doesNotMatch(totalFaq, /no una base fija/);
});

test('explica guardado compartido y alternativas al arrastre', () => {
  const route = text(byId('recorrido'));
  for (const expected of ['asa', 'Antes / después', 'Guardar cambios', 'Cancelar', 'equipo', 'calificación']) assert(route.includes(expected), expected);
});

test('utilidad y pérdida no prometen efectivo disponible o irrecuperabilidad', () => {
  const loss = text(byId('cliente-riesgo'));
  assert.match(loss, /recuperación posterior/);
  assert.doesNotMatch(loss, /acción permanente/);
  const report = text(byId('interpretar-utilidad'));
  assert.match(report, /No es saldo de caja ni una autorización para retirar/);
  assert.match(report, /No disponible/);
  assert.match(report, /fecha de declaración/);
});

test('la guía pública no incluye roles, enlaces ni procedimientos internos', () => {
  assert.deepEqual(Object.keys(roles).sort(), ['administrador','ambos','trabajador']);
  assert.doesNotMatch(source, /root|superusuario|\/dashboard\/admin\/|Vencer membresía manualmente|Anular también un pago manual|preactivación/i);
  assert.match(text(byId('membresias')), /soporte de la plataforma/);
  assert.match(text(byId('membresias')), /comprobante no equivale a una renovación confirmada/);
});

test('filtros y navegación mantienen destinos visibles y FAQ accesible', () => {
  assert(source.includes('visibleSections.map((section) => ('));
  assert(source.includes('aria-pressed={roleFilter === role}'));
  assert(source.includes('aria-expanded={showFaq}'));
  assert.equal(new Set(faqs.map(([question]) => question)).size, faqs.length);
  assert.equal(context.guide.GUIDE_VERSION, 'v2.4');
});
