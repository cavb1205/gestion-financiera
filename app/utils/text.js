export function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Compila la consulta una vez; todas las palabras deben estar en el registro. */
export function createTextMatcher(query) {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  if (!tokens.length) return () => true;
  return (values) => {
    const text = normalizeSearchText(values.filter(value => value != null).join(" "));
    return tokens.every(token => text.includes(token));
  };
}

export function clientSearchValues(cliente) {
  return [cliente?.nombres, cliente?.apellidos, cliente?.identificacion,
    cliente?.nombre_local, cliente?.telefono_principal, cliente?.telefono_opcional];
}
