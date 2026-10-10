# Vencimiento manual y corrección de ingresos

Root: Administrar Rutas → detalle → Vencer membresía manualmente.
El diálogo muestra ruta, administrador, plan, vencimiento, motivo obligatorio,
anulación opcional de un pago manual vigente y aviso de solicitudes pendientes.

Vencer no borra cartera ni pagos. Anular un ingreso lo conserva en historial y
lo excluye de los totales; no implica devolución de dinero. Una ruta ya vencida
permite corregir un ingreso sin renovar antes ni alterar la fecha de bloqueo.

Los conflictos 409 y respuestas inciertas exigen recargar antes de reenviar.
Si el POST terminó pero falla la recarga, la interfaz indica cambio registrado
y permite verificarlo sin duplicarlo. Cancelar/Escape no escribe.

La suspensión manual prevalece sobre fechas futuras/gracia/preactivación. Root
mantiene acceso; otros usuarios pueden tramitar renovación o cambiar de ruta.
Las sesiones comprueban el estado al navegar, recuperar foco y cada minuto
visible. El servidor bloquea inmediatamente solicitudes operativas posteriores.
Un comprobante subido en suspensión manual espera aprobación sin dar acceso temporal.

Verificación: build y ESLint de los archivos cambiados; `tests/suscripciones-browser.cjs`
contra `ops/prueba_suscripciones_local.py` del backend. Desktop y móvil Chrome,
API real Django, SQLite en memoria y datos ficticios. No se prueban correcciones
en rutas reales de producción ni en dispositivo físico/iOS.
