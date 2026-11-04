# Operación y entrega

Empieza por [Estado actual del proyecto](ESTADO-ACTUAL-PROYECTO.md) para ubicar el módulo, los repositorios y las versiones verificadas.

## Accesos para quien retome el proyecto

| Sistema | Acceso que se necesita |
| --- | --- |
| GitHub | Lectura pública de `cavb1205/gestion-financiera` y `cavb1205/sellsystem`. Para publicar ramas o integrar cambios se necesita una cuenta autorizada por el propietario. |
| Vercel | Acceso al equipo que administra el proyecto `gestion-financiera`. Confirmar el alias activo de `app.carterafinanciera.com`, el estado de la publicación y el SHA asociado en GitHub. |
| VPS y panel de infraestructura | El propietario entrega el manual privado `ACCESO-Y-OPERACION.md` y autoriza una identidad SSH para la tarea. El manual indica el host activo, su huella, los servicios, los directorios y los respaldos. En el checkout principal de operación está en `operacion-local/ACCESO-Y-OPERACION.md`, dentro de la carpeta del proyecto. Los worktrees de esta máquina pueden enlazar a esa carpeta. En un clon nuevo, solicita el manual al propietario. |
| Plataforma | Usar una cuenta de prueba local para desarrollo. En producción solicitar el rol y alcance de rutas que requiere la tarea. La cuenta de aplicación, el acceso SSH y el acceso a los repositorios son independientes. |

La configuración de producción se gestiona en el servidor y en Vercel. Usa el canal privado del propietario para recuperar accesos. Evita incluir claves, tokens, archivos de configuración privada, volcados o datos de clientes en el repositorio, PR o logs de pruebas.

## Desarrollo local

Clona los dos repositorios canónicos en carpetas separadas. Los worktrees y copias temporales de una sesión son reutilizables después de comprobar su origen y estado, pero una máquina nueva parte de GitHub.

Frontend, desde `gestion-financiera`, con Node 24 y el lockfile del repositorio:

```sh
npm ci
npm run dev
node --test tests/*.test.mjs app/utils/*.test.mjs app/dashboard/reportes/utilidad/report-model.test.mjs
npm run lint
npm run build
```

Configura `NEXT_PUBLIC_API_URL` en `.env.local` con la URL de un backend local o un entorno de pruebas. Ese valor se incorpora a la aplicación del navegador. Para probar un flujo financiero completo, usa una base desechable, usuarios ficticios y una configuración local de autenticación y CORS.

Backend, desde `sellsystem`, con Python 3.12:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install --require-hashes --only-binary=:all: -r requirements.lock
.venv/bin/python ops/correr_pruebas_aisladas.py
```

El ejecutor usa SQLite en memoria, bloquea la red y no requiere `sell_system/variables.py`. Para limitar la prueba, añade el módulo, por ejemplo `Tiendas.test_cierres.CierresAnterioresTests`. Si una plataforma no ofrece un binario compatible con el lockfile, comprueba la compatibilidad en Linux antes de modificar dependencias. Revisa `ops/python-runtime-linux.json` para el entorno de referencia.

## Publicación y verificación

1. Prueba el commit desde un árbol limpio. Verifica autorización de despliegue, GitHub `main` y la versión que sirve producción. Identifica cambios de código, configuración y esquema por separado.
2. **Frontend.** Publica el commit en `main` siguiendo el flujo Git de Vercel. Verifica que el dominio de producción apunte a un despliegue `READY` de ese SHA. Comprueba las rutas y archivos estáticos que afecte el cambio.
3. **Backend.** Compara el árbol activo con el último commit desplegado. Prepara los archivos desde el commit de GitHub con sus huellas y respalda los archivos a sustituir. Para cambios de esquema, prepara también el respaldo recuperable y el plan de migración antes de escribir. Publica el commit en GitHub antes de aplicarlo al VPS.
4. Verifica el host y aplica los archivos en el directorio del servicio conservando propietario y permisos. Ejecuta `manage.py check --deploy` con el intérprete del servicio. Si el cambio requiere una migración, revisa `migrate --plan` y aplica solo el plan acordado. Los scripts `ops/desplegar_*.py` del backend son referencias de entregas concretas con supuestos y commits propios.
5. Recarga únicamente el servicio afectado. Comprueba que los procesos nuevos sirvan el código esperado y que los anteriores hayan terminado. Verifica HTTPS y los flujos autorizados. Para comprobar el cierre sin crearlo usa el GET de resumen; el POST registra un cierre real.
6. Registra fecha, SHA de ambos componentes, resultado de pruebas, publicación Vercel si corresponde, estado de servicios y ubicación privada del respaldo. Ante un fallo, restaura el código respaldado, verifica el servicio y reconcilia GitHub con la versión servida. Si hubo una migración, sigue el plan de reversión específico del esquema.

El artefacto de despliegue se genera desde GitHub, no desde un checkout de producción. Conserva respaldo de código y respaldo de datos por separado. Si la aplicación comparte infraestructura con otro servicio, valida su alcance antes de reiniciar dependencias comunes.
