import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Sistema de Citas Médicas
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Gestión eficiente de citas médicas para pacientes, doctores y
            administradores
          </p>

          <div className="flex justify-center gap-6 mb-16">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Registrarse
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Para Pacientes</h3>
              <p className="text-gray-600">
                Agenda, cancela y reprograma tus citas médicas de forma fácil y
                rápida
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Para Doctores</h3>
              <p className="text-gray-600">
                Gestiona tu agenda, confirma disponibilidad y revisa tu
                calendario
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">
                Para Administradores
              </h3>
              <p className="text-gray-600">
                Administra usuarios, genera reportes y supervisa el sistema
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
