// utils/format.js
// Utilidades de formato compartidas

const formatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formatea un monto numérico como moneda con símbolo "$".
 * Formato genérico (no atado a ningún locale específico).
 * @param {number|string} amount
 * @returns {string} Ej: "$1.500.000"
 */
export function formatMoney(amount) {
  return "$" + formatter.format(amount ?? 0);
}

/**
 * Redondea un valor monetario a entero (sin centavos).
 * Usa Math.round para redondeo bancario estándar.
 * @param {number|string} amount
 * @returns {number}
 */
export function roundMoney(amount) {
  return Math.round(parseFloat(amount) || 0);
}

/**
 * Calcula el total a pagar de una venta: capital + interés, redondeado a entero.
 * Replica la lógica del backend para mantener consistencia.
 * @param {number|string} valorVenta
 * @param {number|string} interes - porcentaje (ej: 20 para 20%)
 * @returns {number}
 */
export function calcularTotal(valorVenta, interes) {
  const capital = roundMoney(valorVenta);
  return Math.round(capital + (parseFloat(interes) / 100) * capital);
}

/**
 * Calcula el valor de cada cuota redondeando hacia arriba (ceil).
 * La última cuota absorbe el residuo y puede ser menor.
 * @param {number} totalAPagar - ya redondeado a entero
 * @param {number} cuotas
 * @returns {number}
 */
export function calcularCuota(totalAPagar, cuotas) {
  const numCuotas = parseInt(cuotas) || 1;
  return Math.ceil(totalAPagar / numCuotas);
}

/**
 * Parsea un valor monetario de la API a número entero seguro.
 * @param {number|string} value
 * @returns {number}
 */
export function parseMoney(value) {
  return Math.round(parseFloat(value) || 0);
}

/**
 * Parsea una fecha de la API a Date en hora LOCAL.
 * Los DateField de Django llegan como "YYYY-MM-DD"; new Date() los
 * interpretaría como medianoche UTC y en América (UTC-5/-6) se mostraría
 * el día anterior. Aquí se construyen como medianoche local.
 * Los datetime ISO (con hora) pasan directo a new Date().
 * @param {string|Date} value
 * @returns {Date|null}
 */
export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formatea una fecha de la API para mostrar, sin desfase de zona horaria.
 * @param {string|Date} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string} Ej: "7 jul 2026", o "—" si no hay fecha válida
 */
export function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  const d = parseLocalDate(value);
  return d ? d.toLocaleDateString(undefined, options) : "—";
}
