import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  // Redirect to home if already logged in
  const session = await getSession();
  
  if (session) {
    redirect("/");
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
