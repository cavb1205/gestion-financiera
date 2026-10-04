const ANDROID_URL = "https://play.google.com/store/apps/details?id=org.telegram.messenger";
const IOS_URL = "https://apps.apple.com/app/telegram-messenger/id686449807";

export function whatsappPhone(phone, countryPrefix) {
  const raw = String(phone || "").trim();
  if (!raw || !/^\+?[\d\s().-]+$/.test(raw)) return null;
  let digits = raw.replace(/\D/g, "");
  const prefix = String(countryPrefix || "").replace(/\D/g, "");
  if (raw.startsWith("00")) {
    digits = digits.slice(2);
  } else if (!raw.startsWith("+")) {
    if (!/^[1-9]\d{0,2}$/.test(prefix)) return null;
    if (!digits.startsWith(prefix)) digits = `${prefix}${digits.replace(/^0+/, "")}`;
  }
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function validInvitation(value) {
  return Boolean(value && Number.isInteger(value.id) && value.id > 0
    && /^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}\?start=[A-Za-z0-9_-]{43}$/.test(value.enlace || "")
    && Number.isFinite(Date.parse(value.expira_en)) && Date.parse(value.expira_en) > Date.now());
}

export function invitationExpiry(value, timeZone) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const options = { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" };
  try {
    return new Intl.DateTimeFormat("es", { ...options, ...(timeZone ? { timeZone } : {}) }).format(date);
  } catch {
    return new Intl.DateTimeFormat("es", options).format(date);
  }
}

export function invitationMessage({ firstName, invitation, timeZone }) {
  if (!validInvitation(invitation)) throw new Error("La invitación venció o no es válida. Prepara una nueva.");
  const name = String(firstName || "").trim().split(/\s+/)[0];
  return `${name ? `Hola ${name}` : "Hola"} 👋\n\nPuedes recibir por Telegram avisos de tus créditos, pagos y saldo pendiente. Es opcional. 🙂\n\n📲 Si todavía no tienes Telegram:\n1. Instálalo desde el enlace para tu celular:\n🤖 Android: ${ANDROID_URL}\n🍎 iPhone: ${IOS_URL}\n2. Abre Telegram y sigue los pasos para crear tu cuenta.\n3. Vuelve a este mensaje de WhatsApp y abre tu invitación personal:\n\n👉 ${invitation.enlace}\n\nPulsa “Iniciar” y luego “Acepto vincular este chat”. ¡Listo! Recibirás tus avisos y podrás consultar tus créditos en el menú. ✅\n\nSi ya tienes Telegram, abre directamente la invitación.\n\n🔒 El enlace es personal y de un solo uso: no lo compartas. Vence el ${invitationExpiry(invitation.expira_en, timeZone)}. Si vence, pídenos otro. Una vez que aceptes, seguirás recibiendo avisos aunque el enlace venza.`;
}

export function whatsappInvitationUrl(phone, message) {
  if (!/^[1-9]\d{7,14}$/.test(phone || "") || !message) return null;
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}
