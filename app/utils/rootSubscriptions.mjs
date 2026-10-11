// Días de calendario de la ruta; no confundir acceso temporal con un plan pagado.
function dayDifference(deadline, now, timeZone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline || "")) return null;
  let formatter;
  try { formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timeZone || "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }); }
  catch { formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }); }
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  const today = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  return Math.round((Date.parse(`${deadline}T00:00:00Z`) - today) / 86400000);
}

export function membershipDeadline(tm) {
  return tm.estado === "Pre-activada" && !tm.vencida_manualmente ? tm.pre_activada_hasta : tm.fecha_vencimiento;
}

export function getMembershipInfo(tm, now = new Date()) {
  if (tm.vencida_manualmente) return { days: 0, graceDays: 0, status: "expired", label: "Vencida manualmente" };
  const days = dayDifference(membershipDeadline(tm), now, tm.tienda?.zona_horaria);
  if (tm.estado === "Pre-activada") {
    if (days == null) return { status: "unknown", label: "Plazo temporal por revisar" };
    return { days, status: days >= 0 ? "temporary" : "expired", label: days >= 0 ? "Acceso temporal · pago por verificar" : "Acceso temporal vencido" };
  }
  if (days == null) return { days: 0, graceDays: 0, status: "unknown", label: "Fecha por revisar" };
  const graceDays = days + 2;
  if (days <= -2) return { days, graceDays, status: "expired", label: "Bloqueada" };
  if (days === -1) return { days, graceDays, status: "grace", label: `Gracia · ${graceDays}d` };
  if (days === 0) return { days, graceDays, status: "today", label: `Vence hoy · ${graceDays}d p/bloqueo` };
  return { days, graceDays, status: days <= 3 ? "warn" : "ok", label: `${days}d` };
}

export function boundedPage(currentPage, count, pageSize = 10) {
  return Math.max(1, Math.min(currentPage, Math.max(1, Math.ceil(count / pageSize))));
}
