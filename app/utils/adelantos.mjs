/** Etiqueta informativa; no cambia saldos, vencimientos ni permisos de cobro. */
export function etiquetaCuotasAdelantadas(credito) {
  const calendario = credito?.calendario_pago;
  if ([credito?.estado_venta, calendario?.estado].some(estado =>
    estado === 'Pagado' || estado === 'Perdida')) return '';

  let cuotas;
  if (calendario) {
    // El calendario separa anticipo y mora: cuotas_atrasadas nunca es negativo.
    // Usar el valor contractual evita redondear antes de convertir a cuotas.
    const total = Number(credito.total_a_pagar);
    const cantidad = Number(credito.cuotas);
    const cuota = Number.isFinite(total) && total > 0 && Number.isFinite(cantidad) && cantidad > 0
      ? total / cantidad : Number(credito.valor_cuota);
    const anticipo = Number(calendario.anticipo);
    if (!Number.isFinite(anticipo) || anticipo <= 0 || !Number.isFinite(cuota) || cuota <= 0) return '';
    cuotas = anticipo / cuota;
  } else {
    // Compatibilidad con créditos diarios: el campo histórico expresa cuotas,
    // aunque su nombre sea dias_atrasados. Un valor negativo indica adelanto.
    cuotas = -Number(credito?.dias_atrasados);
  }

  if (!Number.isFinite(cuotas) || cuotas <= 0) return '';
  const redondeadas = Math.round(cuotas * 100) / 100;
  if (redondeadas === 0) return 'Menos de 0,01 cuotas adelantadas';
  const cantidad = redondeadas.toLocaleString('es-CL', { maximumFractionDigits: 2 });
  return `${cantidad} ${redondeadas === 1 ? 'cuota adelantada' : 'cuotas adelantadas'}`;
}
