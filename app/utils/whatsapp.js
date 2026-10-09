import { formatMoney } from './format.js';
import { getCuotasAtrasadas, getDiasSinAbono, getMontoParaPonerseAlDia } from './cartera.js';

// Prepara un mensaje manual; no envía mensajes ni registra operaciones.
export function buildWhatsAppEstadoCuenta(credito, { fechaConsulta, fechaOperativa } = {}) {
  const phone = String(credito.cliente?.telefono_principal || '').replace(/[^0-9]/g, '');
  if (!phone) return null;
  const previa = Boolean(fechaConsulta && fechaOperativa && fechaConsulta > fechaOperativa);
  const nombre = credito.cliente?.nombres || 'cliente';
  const pagos = Math.max(0, Number(credito.pagos_realizados) || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 });
  const cuotas = Number(credito.cuotas) || 0;
  const atraso = getCuotasAtrasadas(credito).toLocaleString('es-CL', { maximumFractionDigits: 2 });
  const estado = credito.estado_venta === 'Vencido' ? `vencido con *${atraso} cuotas* de atraso` : 'con saldo pendiente';
  let mensaje = previa
    ? `Hola ${nombre}, compartimos su estado de cuenta con los pagos registrados al *${fechaOperativa}*.\n\n`
    : `Hola ${nombre}, le recordamos que tiene un crédito ${estado}.\n\n`;
  mensaje += `💰 Saldo pendiente: *${formatMoney(credito.saldo_actual)}*\n` +
    `✅ Total abonado: *${formatMoney(credito.total_abonado)}*\n` +
    `📅 Progreso: *${pagos}/${cuotas} cuotas*\n` +
    `📋 Valor cuota: *${formatMoney(credito.valor_cuota)}*\n`;
  if (previa) {
    mensaje += `\n📆 Consulta de cobranza para: *${fechaConsulta}*\n`;
    if (credito.calendario_pago) {
      const pendiente = Math.max(0, Number(credito.calendario_pago.importe_pendiente_hoy) || 0);
      mensaje += pendiente > 0
        ? `Importe pendiente proyectado hasta esa fecha (incluye cuotas anteriores pendientes): *${formatMoney(pendiente)}*.\n`
        : 'No se proyecta una cuota exigible pendiente para esa fecha; los abonos adicionales son voluntarios.\n';
    }
    mensaje += 'Esta proyección supone que no se realizan nuevos pagos antes de esa fecha. Si ya realizó un abono, el estado de cuenta debe actualizarse.\n';
  } else {
    const dias = getDiasSinAbono(credito);
    const vencido = getMontoParaPonerseAlDia(credito);
    if (dias > 0) mensaje += `📆 Sin abono: *${dias} días*\n`;
    if (vencido > 0) mensaje += `⚠️ Para ponerse al día: *${formatMoney(vencido)}*\n`;
  }
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(mensaje)}`;
}
