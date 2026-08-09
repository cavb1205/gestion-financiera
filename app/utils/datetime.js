export const APP_LOCALE = "es-CL";
export const APP_TIME_ZONE = "America/Santiago";

function getParts(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(value)
    .reduce((parts, part) => {
      if (part.type !== "literal") parts[part.type] = Number(part.value);
      return parts;
    }, {});
}

function asDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00Z`);
  }
  return new Date(value);
}

/** Creates a local Date for a date-only input without allowing timezone shifts. */
export function parseAppDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Returns the current calendar date in the application's business timezone. */
export function getAppDateString(offset = 0, value = new Date()) {
  const parts = getParts(value);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
  return date.toISOString().slice(0, 10);
}

export function shiftAppDate(dateString, offset = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ""))) return dateString;
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function getAppDateDifference(value, from = new Date()) {
  if (!value) return null;
  const current = getParts(from);
  const target = getParts(asDate(value));
  if (![current.year, current.month, current.day, target.year, target.month, target.day].every(Number.isFinite)) {
    return null;
  }
  const currentUtc = Date.UTC(current.year, current.month - 1, current.day);
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day);
  return Math.round((currentUtc - targetUtc) / 86400000);
}

export function formatAppDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "—";
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(APP_LOCALE, { ...options, timeZone: APP_TIME_ZONE }).format(date);
}

export function formatAppTime(value, options = { hour: "2-digit", minute: "2-digit" }) {
  if (!value) return "—";
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(APP_LOCALE, { ...options, timeZone: APP_TIME_ZONE }).format(date);
}

export function formatAppDateTime(value, options = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) {
  if (!value) return "—";
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(APP_LOCALE, { ...options, timeZone: APP_TIME_ZONE }).format(date);
}
