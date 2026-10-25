# Actualización de dependencias y sesiones

Runtime: Node 24.x. Next.js 16.4.3, React/React DOM 19.3.1 y sharp 0.35.5 están
fijados en `package.json`; `package-lock.json` fija el resto del árbol. El codemod
oficial migró `middleware.js` a `proxy.js`, conservando las cabeceras existentes.
Se incrementó la versión de caché del service worker para renovar el shell.

La renovación tiene una sola operación en vuelo por sesión. Una respuesta
tardía no puede restaurar una cuenta cerrada ni reemplazar la de otro usuario.
El cambio de sesión descarta las respuestas de peticiones anteriores. Si el
servidor rechaza también el token renovado, se limpian las credenciales y datos
temporales de clientes sin entrar en un ciclo de renovaciones.

Las suspensiones administrativas de una ruta conservan la cuenta, incluso si
se detectan después de renovar. Los errores ordinarios 403 no provocan cierre
de sesión. Las credenciales solo se envían al origen API configurado. El envío
de `FormData` conserva sus cabeceras multipart.

Cada login recibe un identificador local nuevo; las otras pestañas se recargan
al cambiar ese identificador para descartar pantallas del usuario anterior.
El identificador no concede permisos: la API verifica siempre el JWT y los
permisos vigentes. Los tokens permanecen en localStorage; esto no constituye
una migración a cookies HttpOnly ni una solución completa contra XSS.

Comprobaciones con Node 24:

```sh
npm ci
npm run test:sesiones
npm run test:telegram
npm run test:utilidad
npm run lint
npm run build
npm audit
```

El analizador de Next.js 16 incorpora reglas nuevas de React. Se conservan
`set-state-in-effect`, `refs`, `immutability` y `preserve-manual-memoization` como
advertencias durante esta migración; no se refactorizaron las pantallas
financieras para silenciarlas. Las reglas de hooks y demás errores siguen
aplicándose. ESLint 9 es la última rama admitida por los peers de React/import
de esta configuración; la migración de esas herramientas a ESLint 10 sigue
pendiente y no se forzó ignorando dependencias incompatibles.

Publicar la misma versión probada y comprometida en GitHub antes de desplegar.
`engines.node=24.x` selecciona el runtime en Vercel, incluso si la configuración
anterior del proyecto indicaba Node 22. Verificar runtime y commit activos al
terminar. La aplicación del backend requiere un entorno Python separado y
claves privadas nuevas; los usuarios tendrán que iniciar sesión una vez después
del cambio coordinado.
