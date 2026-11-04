# Estado actual de Cartera Financiera

Revisión del 4 de noviembre de 2026. Este documento es el punto de entrada para retomar el proyecto. Las referencias de despliegue son una foto de la última publicación verificada. Compáralas con `origin/main` y con producción antes de intervenir.

## Repositorios y producción

| Componente | Fuente canónica | Producción verificada |
| --- | --- | --- |
| Frontend | [gestion-financiera, main](https://github.com/cavb1205/gestion-financiera/tree/main) | [Aplicación](https://app.carterafinanciera.com), Vercel, commit `f24d84b1db59ead1314e3802f6c775c1ab8beda9` |
| Backend | [sellsystem, main](https://github.com/cavb1205/sellsystem/tree/main) | [API](https://api.carterafinanciera.com), VPS, commit `0fbb8d9b9967038fd29f643d65169061ee62b319` |

El frontend usa Next.js 16, React 19 y Tailwind 4. El backend usa Django 5.2 LTS, Django REST Framework, Gunicorn y PostgreSQL 18 en Ubuntu 24.04 LTS. Nginx sirve la API y el dominio antiguo. `carterafinanciera.com` dirige las navegaciones a `/actualizar-app` del frontend actual para orientar a quienes instalaron la PWA antigua.

El último despliegue de backend fue el 3 de noviembre de 2026. Se comprobaron los 449 archivos versionados contra GitHub y se verificó el cierre de R4 con consultas GET autenticadas. El detalle operativo de SSH, servicios y recuperación está en el manual privado descrito en [Operación y entrega](OPERACION.md).

## Funciones y puntos de entrada

| Área | Comportamiento vigente | Dónde empezar |
| --- | --- | --- |
| Liquidar y Recaudos | Una lista de gestión por ruta y fecha, con recorrido configurable. Abonos y fallas registrados se consultan en Recaudos. El total a cobrar conserva la base de cuotas del día, el pendiente responde a la búsqueda y el cobrado muestra los pagos reales. | [Liquidar](LIQUIDAR-GESTIONES.md), [orden de visita](ORDEN-VISITA.md) |
| Créditos | Frecuencias diaria, semanal y mensual. Los nuevos calendarios semanal y mensual usan intervalos de siete días y mes calendario, respectivamente. El cambio de modalidad al editar tiene restricciones si hay movimientos. | [Edición de modalidad](EDITAR-MODALIDAD-CREDITO.md), backend `Ventas/calendario.py` |
| Cierre de caja | El trabajador cierra el día actual. El administrador puede cerrar una fecha pasada cuando el historial respalda el saldo y no hay movimientos posteriores que impidan usar la caja actual. Se conserva la fecha real de ingreso para auditoría y se verifica la fecha operativa contra el registro de origen. | [Contrato de cierres](API.md#53-cierres-de-caja), backend `Tiendas/cierres.py` y `Tiendas/caja.py` |
| Reportes | Cartera muestra deuda, atraso y señales por frecuencia. Utilidad distingue el resultado calculado de los retiros que ya salieron de caja. | [Cartera y riesgo](CARTERA-RIESGO-FRECUENCIA.md), frontend `app/dashboard/reportes/` |
| Alertas y Telegram | Centro de excepciones y reportes de rutas en el alcance privado de la cuenta operadora. El mantenimiento diario usa las 08:00 de `America/Santiago`. Las notificaciones de clientes tienen un flujo separado con consentimiento. | [Alertas](ALERTAS-PENDIENTES.md), [Telegram](TELEGRAM-GUIA-Y-OPERACION.md), [reportes de rutas](https://github.com/cavb1205/sellsystem/blob/main/docs/REPORTES-RUTAS-TELEGRAM.md) |
| Publicidad | Registro, historial y mapa desde una sola sección, con acceso según la ruta autorizada. | [Navegación](PUBLICIDAD-NAVEGACION.md) |
| Membresías | Renovaciones nuevas mensuales, con importe y datos de transferencia conservados por solicitud. Los planes anuales previos se preservan para el historial. La administración interna puede vencer manualmente una suscripción con registro de auditoría. | [API de membresías](API.md#54-membresías--ciclo-de-vida), [vencimiento manual](SUSCRIPCIONES-MANUALES.md) |
| Sesiones y permisos | El frontend centraliza la renovación de sesión. El backend verifica identidad y acceso a la ruta en cada operación. Los roles de plataforma y los roles de ruta tienen permisos distintos. | [Sesiones](SECURITY-SESSIONS.md), [autorización](https://github.com/cavb1205/sellsystem/blob/main/docs/SECURITY-AUTHORIZATION.md) |

Para reproducir el último caso de cierres en local, crea un gasto con fecha operativa del sábado y hora de registro del martes. El cierre del sábado debe incluir ese gasto si su origen, ruta e importe coinciden y el resto del historial es válido. El cierre del viernes debe bloquearse por el gasto del sábado. Las correcciones posteriores, las anulaciones y los asientos que no se pueden verificar se revisan aparte. La prueba está en `Tiendas/test_cierres.py`.

La guía para trabajadores y administradores se publica en [Guía rápida](https://app.carterafinanciera.com/guia-rapida). Los procedimientos del servidor se mantienen separados.

## Cómo retomar una tarea

1. Ubica el repositorio correcto y comprueba `git status --short --branch`, `git remote -v` y el commit base contra `origin/main`. Si el checkout está sucio, conserva los cambios ajenos y trabaja en un checkout limpio.
2. Lee el punto de entrada y las pruebas del módulo. Si hay un problema en producción, confirma primero el dominio, la ruta y la fecha operativa. Usa consultas de lectura acotadas a los datos autorizados.
3. Reproduce con datos ficticios. Aplica los comandos de [Operación y entrega](OPERACION.md) y verifica el flujo que usa el usuario.
4. Guarda el cambio en GitHub. Cuando se autorice publicar, verifica primero los commits y sigue el procedimiento de despliegue. El código servido debe corresponder a GitHub.

Los archivos `PRODUCTION_BASELINE.md` y sus manifiestos del 9 de octubre documentan una sincronización histórica. Para una intervención nueva, usa el commit servido y genera las huellas desde ese árbol.
