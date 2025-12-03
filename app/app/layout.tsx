import "./../app/globals.css";
import { AuthProvider } from "@/hooks/AuthProvider";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Sistema de Citas Médicas",
  description: "Sistema de gestión de citas para clínicas médicas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        <AuthProvider>
          <Navbar />
          <div className="min-h-screen">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
