// No reconstruir la meta a partir de cobrado + pendiente: contiene anticipos
// y deja fuera créditos ya gestionados. El servidor calcula la base contractual.
export function leerLiquidacion(data, fechaConsulta, vistaPrevia) {
  const resumen = data?.resumen_cobranza;
  const monto = resumen?.total_a_cobrar;
  const total = typeof monto === 'number' || (typeof monto === 'string' && monto.trim() !== '')
    ? Number(monto) : NaN;
  if (!Array.isArray(data?.creditos) || data.fecha_consulta !== fechaConsulta ||
      data.vista_previa !== vistaPrevia || resumen?.fecha_consulta !== fechaConsulta ||
      resumen?.criterio !== 'cuotas_del_dia' || !Number.isFinite(total) || total < 0) {
    throw new Error('No se pudo obtener la base de cuotas del día. Actualiza la consulta o intenta de nuevo.');
  }
  return { creditos: data.creditos, totalACobrar: total };
}

// La gestión es un estado del recorrido, no una cancelación de deuda.
export function gestionadoEnFecha(credito) {
  return credito.gestionado_hoy === true || credito.calendario_pago?.gestionado_hoy === true;
}

export function creditosParaLiquidar(creditos, vistaPrevia = false) {
  return vistaPrevia ? creditos : creditos.filter(credito => !gestionadoEnFecha(credito));
}

export function etiquetaFalla(credito, vistaPrevia) {
  if (vistaPrevia) return 'Vista previa: falla no permitida';
  if (credito.falla_registrada_hoy || credito.calendario_pago?.falla_registrada_hoy) return 'Falla ya registrada en esta fecha';
  if (credito.calendario_pago?.permite_falla === false) return 'Sin cuota exigible: falla no permitida';
  return 'Reportar falla';
}
