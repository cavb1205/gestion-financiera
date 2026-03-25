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
