export const MAX_DATOS_TRANSFERENCIA = 2000;

// Solo se formatea la cuenta que recibió la solicitud, nunca la cuenta actual.
export function textoTransferencia(cuenta) {
  if (typeof cuenta?.datos_transferencia === 'string' && cuenta.datos_transferencia.trim()) {
    return cuenta.datos_transferencia;
  }
  return ['titular', 'banco', 'tipo', 'numero']
    .map(key => typeof cuenta?.[key] === 'string' ? cuenta[key].trim() : '')
    .filter(Boolean).join('\n');
}

export function faseRenovacion(solicitud) {
  if (!solicitud) return 'renovar';
  if (solicitud.estado === 'pendiente') return 'pagar';
  if (['pendiente_confirmacion', 'procesando', 'pre_aprobada'].includes(solicitud.estado)) return 'revision';
  if (['confirmada', 'aprobada'].includes(solicitud.estado)) return 'confirmada';
  return 'cerrada';
}

export function estadoAcceso(membresia, hoy) {
  if (membresia.vencida_manualmente) return { label: 'Vencida', tone: 'rose', blocked: true };
  if (membresia.estado === 'Pre-activada' && membresia.pre_activada_hasta >= hoy) {
    return { label: 'Acceso temporal', tone: 'amber', blocked: false };
  }
  if (membresia.estado === 'Pre-activada' || membresia.estado === 'Vencida') {
    return { label: 'Vencida', tone: 'rose', blocked: true };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(membresia.fecha_vencimiento || '')) {
    return { label: 'Estado por verificar', tone: 'amber', blocked: true };
  }
  if (membresia.fecha_vencimiento >= hoy) return { label: 'Activa', tone: 'emerald', blocked: false };
  const bloqueo = new Date(`${membresia.fecha_vencimiento}T12:00:00Z`);
  bloqueo.setUTCDate(bloqueo.getUTCDate() + 2);
  if (bloqueo.toISOString().slice(0, 10) <= hoy) return { label: 'Vencida', tone: 'rose', blocked: true };
  return { label: 'Pendiente de renovación', tone: 'amber', blocked: false };
}
