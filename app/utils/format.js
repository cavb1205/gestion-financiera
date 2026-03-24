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
