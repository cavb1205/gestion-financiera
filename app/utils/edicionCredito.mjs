import { CUOTAS_PREDETERMINADAS, fechasPlanPago } from './calendario.js';

export function cambiarModalidad(formulario, plazo) {
  if (!Object.hasOwn(CUOTAS_PREDETERMINADAS, plazo) || plazo === formulario.plazo) return formulario;
  return { ...formulario, plazo, cuotas: CUOTAS_PREDETERMINADAS[plazo] };
}

export function versionPlanEdicion(original, plazo) {
  return plazo === original.plazo
    ? Number(original.calendario_version || 0)
    : plazo === 'Diario' ? 0 : 1;
}

export function resumenPlanEdicion(original, { fecha, plazo, cuotas }) {
  if (!original) return null;
  const version = versionPlanEdicion(original, plazo);
  const fechas = fechasPlanPago(fecha, cuotas, plazo, version);
  if (!fechas.length) return null;
  const ultima = fechas.at(-1);
  const vencimiento = new Date(`${ultima}T12:00:00Z`);
  const tolerancia = version === 1 && plazo !== 'Diario' ? 0 : 4;
  vencimiento.setUTCDate(vencimiento.getUTCDate() + tolerancia);
  return { fechas, primera: fechas[0], ultima, vencimiento: vencimiento.toISOString().slice(0, 10),
    tolerancia, version, cambioModalidad: plazo !== original.plazo };
}

export function validarEdicion(venta, pagos, rutaId, creditoId = venta?.id) {
  if (String(venta?.id) !== String(creditoId)) {
    throw new Error('La respuesta no corresponde al crédito que intentas editar. Vuelve a cargar.');
  }
  if (!venta?.id || !venta.cliente?.id || String(venta.tienda) !== String(rutaId)) {
    throw new Error('El crédito no pertenece a la ruta seleccionada. Abre su ruta para editarlo.');
  }
  if (!Number.isInteger(pagos?.count) || pagos.count < 0) {
    throw new Error('No se pudo confirmar si el crédito tiene movimientos. Actualiza antes de editar.');
  }
  if (!Object.hasOwn(CUOTAS_PREDETERMINADAS, venta.plazo)) {
    throw new Error('La modalidad del crédito no es válida. Revisa el crédito antes de editar.');
  }
  if (!fechasPlanPago(venta.fecha_venta, 1, 'Diario').length) {
    throw new Error('No se pudo confirmar la fecha del crédito. Vuelve a cargar antes de editar.');
  }
  return pagos.count > 0;
}
