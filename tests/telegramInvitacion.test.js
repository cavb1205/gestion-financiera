import test from "node:test";
import assert from "node:assert/strict";
import { invitationMessage, validInvitation, whatsappPhone, whatsappInvitationUrl } from "../app/utils/telegramInvitacion.js";

const invitation = () => ({ id: 7, enlace: `https://t.me/AvisosDePagoBot?start=${"a".repeat(43)}`, expira_en: new Date(Date.now() + 72 * 3600000).toISOString() });

test("el destinatario usa teléfono internacional y exige prefijo para números locales", () => {
  assert.equal(whatsappPhone("+57 312 345 6789", ""), "573123456789");
  assert.equal(whatsappPhone("0057 312 345 6789", ""), "573123456789");
  assert.equal(whatsappPhone("3123456789", "57"), "573123456789");
  assert.equal(whatsappPhone("573123456789", "57"), "573123456789");
  assert.equal(whatsappPhone("3123456789", ""), null);
  assert.equal(whatsappPhone("123", "57"), null);
  assert.equal(whatsappPhone("+573123456789 ext 12", "57"), null);
  assert.equal(whatsappPhone("++573123456789", "57"), null);
  assert.equal(whatsappPhone("573+123456789", "57"), null);
});

test("un mensaje reúne instalación, regreso a WhatsApp y aceptación sin exponer la aplicación", () => {
  const value = invitation();
  const message = invitationMessage({ firstName: "Camilo Andrés", invitation: value, timeZone: "America/Santiago" });
  assert.ok(message.startsWith("Hola Camilo 👋"));
  for (const text of ["play.google.com", "apps.apple.com", "Vuelve a este mensaje", value.enlace, "Iniciar", "Acepto vincular este chat", "un solo uso", "Vence el"]) assert.ok(message.includes(text));
  for (const text of ["carterafinanciera.com", "ruta", "chat ID", "respóndenos", "Andrés"]) assert.ok(!message.includes(text));
  const url = new URL(whatsappInvitationUrl("573123456789", message));
  assert.equal(url.searchParams.get("phone"), "573123456789");
  assert.equal(url.searchParams.get("text"), message);
});

test("no se comparte una invitación vencida, mal formada o con un enlace distinto de Telegram", () => {
  for (const value of [null, { ...invitation(), expira_en: "incorrecta" }, { ...invitation(), expira_en: new Date(0).toISOString() }, { ...invitation(), enlace: "https://app.carterafinanciera.com" }, { ...invitation(), id: null }]) {
    assert.equal(validInvitation(value), false);
    assert.throws(() => invitationMessage({ invitation: value }));
  }
  assert.equal(whatsappInvitationUrl(null, "Mensaje"), null);
});
