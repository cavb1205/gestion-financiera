This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.




Lo que queda por hacer

3	Búsqueda Global — buscador en el header del layout, busca en clientes/ventas/recaudos	Media

5	Bloqueo de rutas + auto-vencimiento — pendiente del endpoint backend que te pasé	Baja (con endpoint)


4. WhatsApp masivo / recordatorios
Hoy solo hay WhatsApp individual. Un botón "Enviar recordatorio a todos los morosos" que abra una lista con mensajes pre-redactados sería muy valioso para el cobrador. No requiere API — basta generar un mensaje con wa.me por cada cliente.

9. PWA / Funcionalidad offline
El cobrador trabaja en la calle con señal inestable. Configurar el app como PWA (installable, con service worker básico) mejoraría mucho la experiencia móvil. Next.js lo soporta con next-pwa.

11. Confirmación por WhatsApp al cliente — Al registrar un pago, opción de enviar recibo por WhatsApp al número del cliente.


