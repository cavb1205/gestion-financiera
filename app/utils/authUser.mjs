const publicFields = [
  'id', 'username', 'first_name', 'last_name', 'email',
  'is_active', 'is_staff', 'is_superuser', 'last_login', 'date_joined',
];

// Lista explícita también para sesiones guardadas antes de corregir el backend.
export function publicUserData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return Object.fromEntries(publicFields
    .filter((field) => Object.prototype.hasOwnProperty.call(value, field))
    .map((field) => [field, value[field]]));
}
