// Listado paginado de gastos (/gastos/t/<id>/?page=...): consulta y lectura de la respuesta.

export function consultaGastos({ pagina = 1, limite = 10, filtros = {} } = {}) {
  const params = new URLSearchParams({ page: String(pagina), limit: String(limite) });
  if (filtros.fechaInicio) params.set('desde', filtros.fechaInicio);
  if (filtros.fechaFin) params.set('hasta', filtros.fechaFin);
  if (filtros.tipoGasto && filtros.tipoGasto !== 'Todos') params.set('tipo', String(filtros.tipoGasto));
  return `?${params.toString()}`;
}

export function leerPaginaGastos(data) {
  if (!data || !Array.isArray(data.resultados) || !Number.isInteger(data.total_registros)
      || !Number.isInteger(data.paginas) || !Number.isInteger(data.pagina)) {
    throw new Error('El servidor devolvió un listado de gastos inválido. Intenta de nuevo.');
  }
  const totalMonto = Number(data.total_monto);
  return {
    gastos: data.resultados,
    totalRegistros: data.total_registros,
    totalMonto: Number.isFinite(totalMonto) ? totalMonto : 0,
    paginas: Math.max(1, data.paginas),
    pagina: data.pagina,
  };
}
