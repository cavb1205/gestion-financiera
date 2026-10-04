# Telegram para clientes: guía y operación

Actualizado: 3 de octubre de 2026.

Aplicación: `https://app.carterafinanciera.com`. API: `https://api.carterafinanciera.com`.

## Activar avisos con un solo mensaje

1. Abre el perfil del cliente desde una ruta para la cual tengas permisos.
2. Confirma que desea recibir avisos y revisa su teléfono y el prefijo del país.
3. En «Avisos por Telegram», pulsa «Enviar invitación por WhatsApp».
4. Se prepara un mensaje con el primer nombre, los enlaces oficiales de Android
   e iPhone y la invitación personal. Revisa el destinatario y pulsa «Enviar» en
   WhatsApp: la aplicación no lo envía automáticamente.
5. El cliente instala Telegram y crea su cuenta. Luego vuelve al mismo mensaje
   de WhatsApp, abre la invitación, pulsa «Iniciar» y acepta vincular el chat.
6. Los avisos quedan activos inmediatamente, sin otra confirmación del personal.
   Al regresar al perfil se actualiza el estado; también puedes usar el botón
   «Actualizar estado de Telegram».

Si el teléfono no es válido, el botón de WhatsApp sigue visible pero deshabilitado.
«Copiar mensaje» permite entregar las mismas instrucciones e invitación por otro
medio. Si el navegador no permite copiar, el texto queda disponible para selección
manual. Si bloquea la ventana de WhatsApp, aparece «Abrir WhatsApp».

## Vigencia y administración de invitaciones

- Las invitaciones nuevas duran **72 horas** y son personales, de un solo uso.
  La fecha y hora de vencimiento aparecen en el perfil y en el mensaje.
- Las invitaciones emitidas antes de este cambio conservan su vencimiento original.
- Mientras el perfil siga abierto, «Copiar mensaje» y «Reenviar invitación por
  WhatsApp» reutilizan la invitación preparada y todavía vigente.
- El servidor solo almacena el hash del token, no el enlace recuperable. Si
  recargas o vuelves a abrir el perfil, preparar el mensaje genera otra invitación
  e invalida la anterior. La tarjeta lo advierte antes de hacerlo.
- «Generar nuevo enlace y reemplazar el anterior» invalida el enlace anterior.
  Entrega siempre el mensaje más reciente directamente al cliente.
- «Cancelar invitación» invalida únicamente esa invitación pendiente. Si el
  cliente ya la aceptó, no revoca su vínculo ni interrumpe sus avisos.
- Una vez aceptada, la vinculación permanece para los próximos créditos de la
  ficha. El vencimiento de la invitación no desactiva los avisos.
- Para detener avisos futuros, utiliza «Revocar vinculación».
- Una solicitud pendiente del flujo antiguo aún puede requerir la confirmación
  del personal. El perfil la identifica como «Solicitud del flujo anterior».

No publicar enlaces en grupos ni compartirlos entre clientes. Quien recibe el
enlace puede aceptarlo; verificar el destinatario antes de enviarlo es esencial.

## Identidad y alcance

La vinculación corresponde a **una ficha de cliente**, no a un teléfono. No se
asocia automáticamente por nombre, documento ni número de WhatsApp.

Si una persona tiene fichas en varias rutas, debe aceptar una invitación por
cada ficha. Puede recibir todas en el mismo chat privado de Telegram. Los
créditos futuros de cada ficha vinculada quedan incluidos.

Administradores y trabajadores asignados pueden administrar los avisos dentro
de su alcance autorizado. El backend vuelve a validar permisos y rutas activas
en `Tienda_Administrador` en las operaciones y consultas. Mostrar un botón en
pantalla no concede permisos.

## Avisos y consultas

Se notifican operaciones compatibles: crédito nuevo, renovación, abono, visita
registrada sin abono, corrección o anulación de un movimiento, ajuste
administrativo de fecha/cuotas y cambios o eliminación del crédito. El cierre
por renovación aclara que el saldo trasladado no representa un abono ni dinero
nuevo entregado.

Según la operación, se muestran fecha, monto, estado, plazo, cuotas, total
abonado, saldo y progreso. Los abonos no exponen el número interno del recaudo.
Una falla informa una visita sin abono registrada explícitamente, no un
recordatorio automático por el paso de los días.

El cliente puede usar `/menu`, `/creditos`, `/movimientos` y los botones del bot
para consultar créditos activos, detalles y movimientos recientes. Las
consultas revalidan el vínculo y no modifican datos financieros.

Los mensajes no incluyen rutas, comentarios internos ni la URL de la aplicación;
solo muestran el primer nombre del cliente. Son informativos: cualquier
discrepancia debe revisarse en la aplicación, sin duplicar pagos para intentar
repetir una notificación.

## Privacidad, entrega y retención

- El cliente acepta explícitamente desde un chat privado. El webhook requiere
  el secreto configurado y usa un bot separado del administrativo.
- No se persiste el texto del cliente ni el mensaje enviado en los registros
  de retención; se conservan los metadatos necesarios de entrega y limpieza.
- Una tarea horaria intenta eliminar mensajes registrados al cumplir unas
  24 horas, sin cerrar la vinculación. Telegram limita las eliminaciones a
  una ventana de 48 horas: no se garantiza borrar mensajes no registrados o
  con fallos persistentes.
- Los avisos se registran en una cola transaccional. Si la operación financiera
  se revierte, su evento también se revierte.
- El worker procesa hasta 20 fichas por ejecución y corre cada minuto. La
  limpieza corre cada hora; los procesos usan bloqueos para no solaparse.
- Los reintentos son acotados. Una respuesta perdida después de una posible
  entrega se trata como incierta y no se reenvía automáticamente para evitar
  duplicados. Un evento fallido o incierto puede detener los avisos de esa ficha
  hasta su revisión técnica.
- Los snapshots de eventos terminales se depuran; eventos no terminales vencen
  después de siete días. Se conserva el estado técnico mínimo para diagnóstico
  y deduplicación.

La aplicación aún no ofrece una pantalla para inspeccionar o reanudar eventos
fallidos/inciertos. Si un aviso falta con la ficha activa y la operación guardada,
se debe escalar al soporte. No registrar de nuevo el pago.

## Implementación y despliegue

Frontend: `app/components/TelegramVinculacionCard.js`,
`app/utils/telegramInvitacion.js`, perfil del cliente y `/guia-rapida`.

Backend: `Clientes/telegram_vinculacion.py`, `telegram_views.py`,
`telegram_webhook.py`, `telegram_eventos.py`, `telegram_worker.py` y
`telegram_limpieza.py`. El cambio a 72 horas no requiere migración de tablas.

La aplicación corresponde al proyecto Vercel `gestion-financiera` del equipo
`cavb1205s-projects`. El sitio React antiguo de `carterafinanciera.com` no debe
modificarse para cambios de esta aplicación.

Tokens, secretos y credenciales permanecen exclusivamente en la configuración
privada del servidor; nunca deben añadirse al frontend ni a GitHub.
