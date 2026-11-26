// Interés por defecto de la ruta: porcentaje total sobre el capital de cada
// crédito (mismo significado que venta.interes). Lo define quien crea la
// ruta; la plataforma no fija ni recomienda tasas. Las rutas creadas antes
// de esta regla no tienen tasa (null) y conservan el 20 % histórico.

export const INTERES_HISTORICO = 20;

export const TEXTO_RESPONSABILIDAD_INTERES =
  "La tasa de interés la defino yo y soy responsable de que cumpla con la ley de mi país. Cartera Financiera no fija ni recomienda tasas.";

export const AYUDA_INTERES_RUTA =
  "Porcentaje que se suma al capital de cada crédito. Podrás cambiarlo en cada crédito.";

/** Devuelve un mensaje de error o "" si el valor es válido. */
export function validarInteresDefecto(valor) {
  const texto = String(valor ?? "").trim();
  if (texto === "") return "Indica el interés por defecto de la ruta.";
  if (!/^\d+$/.test(texto)) return "El interés debe ser un número entero.";
  const numero = Number(texto);
  if (numero > 100) return "El interés debe estar entre 0 y 100.";
  return "";
}

/** Error de creación de ruta (tasa + aceptación) o "" si se puede enviar. */
export function validarDeclaracionInteres(valor, aceptado) {
  return validarInteresDefecto(valor) || (aceptado === true ? "" :
    "Confirma que la tasa de interés es tu responsabilidad.");
}

/** Cuerpo que esperan /register/ y /tiendas/create/. */
export function camposDeclaracionInteres(valor) {
  return {
    interes_defecto: Number(String(valor).trim()),
    acepta_responsabilidad_interes: true,
  };
}

/** Tasa inicial de un crédito nuevo según la ruta. */
export function interesInicialCredito(tienda) {
  const tasa = tienda?.interes_defecto;
  return Number.isInteger(tasa) ? tasa : INTERES_HISTORICO;
}

/** True si la ruta tiene tasa declarada y la pantalla puede editarla. */
export function rutaConInteresDefecto(tienda) {
  return Number.isInteger(tienda?.interes_defecto);
}
