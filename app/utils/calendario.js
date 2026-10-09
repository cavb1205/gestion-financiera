// Fechas de vista previa. La API valida y fija el calendario contractual.
export const CUOTAS_PREDETERMINADAS = { Diario: 20, Semanal: 4, Mensual: 1 };

export function fechasPlanPago(fecha, cuotas, plazo) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || "") || !Number.isInteger(Number(cuotas)) || Number(cuotas) < 1 || Number(cuotas) > 120 || !Object.hasOwn(CUOTAS_PREDETERMINADAS, plazo)) return [];
  const [year, month, day] = fecha.split("-").map(Number);
  const ancla = new Date(Date.UTC(year, month - 1, day));
  if (ancla.toISOString().slice(0, 10) !== fecha) return [];
  return Array.from({ length: Number(cuotas) }, (_, indice) => {
    const numero = indice + 1;
    let vencimiento;
    if (plazo === "Mensual") {
      const primerDia = new Date(Date.UTC(year, month - 1 + numero, 1));
      const ultimoDia = new Date(Date.UTC(primerDia.getUTCFullYear(), primerDia.getUTCMonth() + 1, 0)).getUTCDate();
      vencimiento = new Date(Date.UTC(primerDia.getUTCFullYear(), primerDia.getUTCMonth(), Math.min(day, ultimoDia)));
    } else {
      vencimiento = new Date(ancla);
      vencimiento.setUTCDate(day + numero * (plazo === "Semanal" ? 7 : 1));
    }
    return vencimiento.toISOString().slice(0, 10);
  });
}

export function permiteFalla(credito) {
  return credito.calendario_pago ? credito.calendario_pago.permite_falla === true : true;
}

export function montoPendienteHoy(credito) {
  return credito.calendario_pago ? Number(credito.calendario_pago.importe_pendiente_hoy) || 0 : Number(credito.valor_cuota) || 0;
}

export function pendienteObligatorio(credito) {
  return credito.calendario_pago ? credito.calendario_pago.pendiente_operativo === true : true;
}

export function resumirLiquidacion(creditos) {
  return creditos.reduce((resumen, credito) => {
    const calendario = credito.calendario_pago;
    resumen.importePendiente += montoPendienteHoy(credito);
    if (pendienteObligatorio(credito)) resumen.obligatorios += 1;
    if (calendario?.cobro_voluntario) resumen.voluntarios += 1;
    if (calendario?.gestionado_hoy) resumen.gestionados += 1;
    return resumen;
  }, { importePendiente: 0, obligatorios: 0, voluntarios: 0, gestionados: 0 });
}
