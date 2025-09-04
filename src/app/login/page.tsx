import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { authOptions } from "@/lib/authOptions";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Verificar si el usuario ya está autenticado
  const session = await getServerSession(authOptions);
  
  // Si ya hay sesión, redirigir a proyectos
  if (session) {
    return redirect("/proyectos");
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-600/20 blur-3xl login-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-600/20 blur-3xl login-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-gradient-to-br from-indigo-400/10 to-blue-600/10 blur-3xl login-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md animate-in slide-in-from-top-2">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg mb-6 login-float">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Quality Team
          </h1>
          <p className="text-gray-600 mt-2 font-medium">Plataforma de gestión de calidad</p>
        </div>
        
        <LoginForm />
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Quality Team. Sistema de gestión QA
          </p>
        </div>
      </div>
    </div>
  );
}
