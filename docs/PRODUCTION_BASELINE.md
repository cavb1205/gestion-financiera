# Código de producción sincronizado

Se tomó como referencia la aplicación activa en `https://app.carterafinanciera.com`
el 9 de octubre de 2026, sin cambiar su comportamiento.

- Proyecto Vercel: `gestion-financiera`, equipo `cavb1205s-projects`.
- Publicación de referencia: `dpl_AnCxvnV2QpbAiEMiwfyQh3dbUYD3`.
- Se verificaron los 135 archivos fuente publicados mediante sus huellas SHA-1
  contra el manifiesto de archivos de Vercel; todos coinciden.
- `production-source-sha256.json` permite verificar nuevamente sus contenidos.
- El commit incorpora mejoras de utilidad, calendario, Liquidar, WhatsApp y
  Publicidad que ya estaban publicadas, no una nueva etapa funcional.
- Las pruebas del repositorio son artefactos de desarrollo y no forman parte del
  paquete publicado. Los cambios locales ajenos a esta publicación se conservaron
  fuera de esta sincronización.

No versionar `.env*`, tokens, credenciales, archivos de clientes, `node_modules`,
`.next` ni `.vercel`. La configuración privada del proyecto permanece en Vercel.
La página antigua `https://carterafinanciera.com` no corresponde a este proyecto.

## Verificación reproducible

Desde la raíz del repositorio:

```bash
python3 -c 'import hashlib,json,pathlib; m=json.loads(pathlib.Path("docs/production-source-sha256.json").read_text()); bad=[p for p,h in m.items() if not pathlib.Path(p).is_file() or hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()!=h]; print("Archivos verificados:",len(m),"Diferencias:",bad); raise SystemExit(bool(bad))'
npm run test:utilidad
npm run test:telegram
npm run build
```

Para mantener esta correspondencia, desplegar desde un commit identificado y
verificar la publicación activa después de cada cambio. No publicar una carpeta
de trabajo con modificaciones adicionales sin revisar su diferencia con Git.
