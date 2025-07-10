import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { authOptions } from "@/lib/authOptions";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  try {
    // Redirect to home if already logged in
    const session = await getServerSession(authOptions);
    
    if (session) {
      return redirect("/");
    }
  } catch (error) {
    console.error("Error al verificar la sesión:", error);
    // Continuamos para mostrar el formulario de login
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Quality Team</h1>
        <p className="text-gray-600">Plataforma de gestión de calidad</p>
      </div>
      
      <LoginForm />
    </div>
  );
}
