"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Define login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isLoading, setIsLoading] = useState(false);
  
  // Setup form with validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      
      // Uso simple de signIn con redirección directa - esta es la forma más confiable
      await signIn("credentials", {
        redirect: true,
        email: data.email,
        password: data.password,
        callbackUrl: "/proyectos" // Siempre redirigir a proyectos después del login
      });
      
      // NextAuth se encargará de la redirección
      toast.success("Iniciando sesión...");
      
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h2>
        <p className="mt-2 text-gray-600">
          Ingresa tus credenciales para acceder
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
            Correo electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                errors.email 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-blue-500 hover:border-gray-300'
              }`}
              placeholder="Pepito@dominio.com"
              {...register("email")}
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <div className="flex items-center space-x-1 text-red-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">{errors.email.message}</p>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              type="password"
              className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                errors.password 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-blue-500 hover:border-gray-300'
              }`}
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
            />
          </div>
          {errors.password && (
            <div className="flex items-center space-x-1 text-red-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">{errors.password.message}</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 focus:scale-105 active:scale-95 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span>Iniciando sesión...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>Iniciar sesión</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Sistema seguro</span>
        </div>
      </div>

      {/* Security Notice */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Conexión segura y cifrada</span>
        </div>
      </div>
    </div>
  );
}
