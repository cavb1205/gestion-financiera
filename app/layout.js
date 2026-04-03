// app/layout.js
import { Inter } from 'next/font/google';
import './globals.css'; // Asegúrate de que esta ruta a tu CSS global sea correcta
import { AuthProvider } from '@/app/context/AuthContext';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from "@vercel/analytics/next"




const inter = Inter({ subsets: ['latin'] });

// Opcional: Metadata para tu aplicación, útil para SEO
export const metadata = {
  title: 'Cartera - Control Panel',
  description: 'Gestión de créditos, recaudos y cartera',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cartera',
  },
};



export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply dark class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}})();`,
          }}
        />
        {/* PWA */}
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ToastContainer
              position="bottom-right"
              theme="dark"
              toastClassName="glass-toast shadow-2xl overflow-hidden cursor-pointer"
              bodyClassName="p-0 m-0"
            />
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}