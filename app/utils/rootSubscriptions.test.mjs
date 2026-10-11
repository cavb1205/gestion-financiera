import test from 'node:test';
import assert from 'node:assert/strict';
import { getMembershipInfo, boundedPage, membershipDeadline } from './rootSubscriptions.mjs';
const now=new Date('2026-10-10T15:00:00Z');

test('preactivada usa el acceso temporal y no el vencimiento anterior',()=>{
  const tm={estado:'Pre-activada',fecha_vencimiento:'2026-09-01',pre_activada_hasta:'2026-10-13'};
  assert.equal(getMembershipInfo(tm,now).status,'temporary');
  assert.equal(membershipDeadline(tm),'2026-10-13');
  assert.match(getMembershipInfo(tm,now).label,/pago por verificar/);
});
test('plazo temporal vencido o desconocido no se presenta como pagado',()=>{
  assert.equal(getMembershipInfo({estado:'Pre-activada',pre_activada_hasta:'2026-10-09'},now).status,'expired');
  assert.equal(getMembershipInfo({estado:'Pre-activada'},now).status,'unknown');
});
test('vencimiento manual prevalece sobre la preactivación',()=>{
  const tm={estado:'Pre-activada',pre_activada_hasta:'2026-10-13',fecha_vencimiento:'2026-10-10',vencida_manualmente:true};
  assert.equal(getMembershipInfo(tm,now).status,'expired');
  assert.equal(membershipDeadline(tm),'2026-10-10');
});
test('respeta la zona de la ruta cerca de medianoche',()=>{
  const instant=new Date('2026-10-11T01:00:00Z');
  const tm={estado:'Activa',fecha_vencimiento:'2026-10-10'};
  assert.equal(getMembershipInfo({...tm,tienda:{zona_horaria:'America/Santiago'}},instant).status,'today');
  assert.equal(getMembershipInfo({...tm,tienda:{zona_horaria:'UTC'}},instant).status,'grace');
});
test('gracia, bloqueo y vencimiento siguen los límites vigentes',()=>{
  assert.equal(getMembershipInfo({fecha_vencimiento:'2026-10-09'},now).status,'grace');
  assert.equal(getMembershipInfo({fecha_vencimiento:'2026-10-08'},now).status,'expired');
  assert.equal(getMembershipInfo({fecha_vencimiento:'2026-10-10'},now).status,'today');
});
test('reducir resultados acota la página sin ocultar registros',()=>{
  assert.equal(boundedPage(2,2),1);assert.equal(boundedPage(2,12),2);
  assert.equal(boundedPage(7,0),1);assert.equal(boundedPage(-1,50),1);
});
