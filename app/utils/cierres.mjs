/** El cierre solo se habilita con la comprobación del servidor para esa ruta y fecha. */
// dia_actual: saldo actual de caja. sin_movimientos_posteriores / saldo_reconstruido:
// fecha anterior; el servidor descuenta lo que pertenece a jornadas posteriores.
const CODIGOS_REGISTRABLES = ['dia_actual', 'sin_movimientos_posteriores', 'saldo_reconstruido'];

export function interpretarResumenCierre(data, fecha, tiendaId) {
  const validacion = data?.validacion_cierre;
  const invalid = () => { throw new Error('No se pudo verificar el cierre de esta fecha. Actualiza antes de registrar.'); };
  if (!validacion || validacion.fecha !== fecha || String(validacion.tienda_id) !== String(tiendaId)
    || typeof validacion.puede_registrar !== 'boolean' || !validacion.codigo || !validacion.mensaje) invalid();
  const numero = value => ['string', 'number'].includes(typeof value) && String(value).trim() !== '' && Number.isFinite(Number(value));
  const totals = ['aportes', 'gastos', 'utilidades', 'recaudos', 'ventas'];
  if (!data.fecha || !totals.every(key => numero(data.fecha[key]))) invalid();
  for (const key of ['count_recaudos', 'count_ventas']) {
    if (!Number.isInteger(data.fecha[key]) || data.fecha[key] < 0) invalid();
  }
  if (validacion.puede_registrar && (!CODIGOS_REGISTRABLES.includes(validacion.codigo)
    || !numero(validacion.saldo_a_registrar))) invalid();
  // Un saldo reconstruido siempre trae su desglose verificable.
  if (validacion.puede_registrar && validacion.codigo === 'saldo_reconstruido'
    && !(numero(validacion.saldo_actual) && numero(validacion.efecto_posterior))) invalid();
  const registrado = validacion.cierre_existente;
  if (registrado && (registrado.fecha_cierre !== fecha || !numero(registrado.valor))) invalid();
  if (validacion.codigo === 'cierre_existente' && !registrado) invalid();
  return {
    ...Object.fromEntries(totals.map(key => [key, Number(data.fecha[key])])),
    count_recaudos: data.fecha.count_recaudos,
    count_ventas: data.fecha.count_ventas,
    fecha_consulta: fecha,
    validacion,
    saldo_cierre: registrado ? Number(registrado.valor)
      : validacion.puede_registrar ? Number(validacion.saldo_a_registrar) : null,
    estado_saldo: registrado ? 'registrado' : validacion.puede_registrar ? 'pendiente' : 'sin_registro',
    desglose: !registrado && validacion.puede_registrar && validacion.codigo === 'saldo_reconstruido'
      ? { saldo_actual: Number(validacion.saldo_actual), efecto_posterior: Number(validacion.efecto_posterior) }
      : null,
  };
}

export function mensajeErrorCierre(error) {
  const fallback = 'No se pudo verificar el cierre. Actualiza antes de registrar.';
  if (['SyntaxError', 'TypeError', 'AbortError'].includes(error?.name)) return fallback;
  return error?.message || fallback;
}
