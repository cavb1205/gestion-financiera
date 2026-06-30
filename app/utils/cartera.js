// app/utils/cartera.js
//
// Clasificación de deterioro de cartera ("riesgo de castigo").
//
// La señal base es `dias_sin_abono` que expone el backend: días calendario
// desde el último abono real (recaudo con valor > 0). Solo se clasifica como
// deteriorado un crédito que además está EN MORA o VENCIDO; de lo contrario un
// cliente que paga semanal o va adelantado saldría como dudoso falsamente.
//
// Tramos acordados (días sin abono):
//   15+  → Dudoso recaudo
//   45+  → Crítico
//   90+  → Irrecuperable (candidato a castigo)
//
// Si el backend aún no expone `dias_sin_abono` (despliegue pendiente), todos
// los créditos caen en nivel 0 ("sano") y la UI no marca falsos positivos.

export const NIVEL_DETERIORO = {
  0: {
    key: "sano",
    label: "Sin riesgo",
    short: "Sin riesgo",
    min: 0,
    // Paleta para badges (clases Tailwind)
    badge:
      "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700",
    text: "text-slate-500",
  },
  1: {
    key: "dudoso",
    label: "Dudoso recaudo",
    short: "Dudoso",
    min: 15,
    badge:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  2: {
    key: "critico",
    label: "Crítico",
    short: "Crítico",
    min: 45,
    badge:
      "bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 dark:border-orange-800/40",
    text: "text-orange-600 dark:text-orange-400",
  },
  3: {
    key: "irrecuperable",
    label: "Irrecuperable",
    short: "Irrecuperable",
    min: 90,
    badge:
      "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/50",
    text: "text-rose-700 dark:text-rose-300",
  },
};

/**
 * Clasifica el nivel de deterioro de un crédito.
 * @param {object} venta - objeto de venta del endpoint /ventas/activas/
 * @returns {{ nivel: number, diasSinAbono: number|null, enMora: boolean } & typeof NIVEL_DETERIORO[number]}
 */
export function clasificarDeterioro(venta) {
  const dias = Number(venta?.dias_sin_abono);
  const enMora =
    venta?.estado_venta === "Vencido" || Number(venta?.dias_atrasados) > 0;
  const diasSinAbono = Number.isFinite(dias) ? dias : null;

  let nivel = 0;
  if (enMora && diasSinAbono !== null) {
    if (diasSinAbono >= NIVEL_DETERIORO[3].min) nivel = 3;
    else if (diasSinAbono >= NIVEL_DETERIORO[2].min) nivel = 2;
    else if (diasSinAbono >= NIVEL_DETERIORO[1].min) nivel = 1;
  }

  return { nivel, diasSinAbono, enMora, ...NIVEL_DETERIORO[nivel] };
}
