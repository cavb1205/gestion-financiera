// app/layout.js
import { Inter } from 'next/font/google';
import './globals.css'; // Asegúrate de que esta ruta a tu CSS global sea correcta
import { AuthProvider } from '@/app/context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from "@vercel/analytics/next"




const inter = Inter({ subsets: ['latin'] });

// Opcional: Metadata para tu aplicación, útil para SEO
export const metadata = {
  title: 'My Money App',
  description: 'Aplicación de gestión de finanzas',
};



export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
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
      </body>
    </html>
  );
}