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
