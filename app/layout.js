// app/layout.js
import { Inter } from 'next/font/google';
import './globals.css'; // Asegúrate de que esta ruta a tu CSS global sea correcta
import { AuthProvider } from './context/AuthContext';




const inter = Inter({ subsets: ['latin'] });

// Opcional: Metadata para tu aplicación, útil para SEO
export const metadata = {
  title: 'My Money App',
  description: 'Aplicación de gestión de finanzas',
};



export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}