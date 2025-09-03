"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { User } from "@/models/User";
import { QAAnalyst } from "@/models/QAAnalyst";

// Define schema for user creation and update
const userFormSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .optional()
    .or(z.literal("")),
  isActive: z.boolean(),
  analystId: z.string().optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: Partial<User>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [unassignedAnalysts, setUnassignedAnalysts] = useState<QAAnalyst[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = Boolean(user?.id);

  // Set up form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: user?.email || "",
      name: user?.name || "",
      password: "",
      isActive: user?.isActive !== undefined ? user.isActive : true,
      analystId: user?.analystId || "",
    },
  });

  // Fetch unassigned analysts
  useEffect(() => {
    const fetchUnassignedAnalysts = async () => {
      try {
        // Obtener los analistas no asignados
        const response = await fetch("/api/users/unassigned-analysts");
        if (!response.ok) {
          throw new Error("Error al obtener analistas disponibles");
        }
        
        let analysts = await response.json();
        
        // Si estamos en modo edición y hay un analista asignado al usuario
        if (isEditMode && user?.analystId) {
          // Verificar si el analista actual ya está en la lista
          const analystExists = analysts.some((a: QAAnalyst) => a.id === user.analystId);
          
          // Si no existe en la lista, necesitamos agregarlo
          if (!analystExists) {
            // Si tenemos los detalles del analista en el objeto usuario
            if (user.analyst) {
              analysts = [...analysts, user.analyst];
            } 
            // Si no tenemos los detalles, necesitamos buscarlos
            else {
              try {
                const analystResponse = await fetch(`/api/qa-analysts/${user.analystId}`);
                if (analystResponse.ok) {
                  const currentAnalyst = await analystResponse.json();
                  analysts = [...analysts, currentAnalyst];
                } else {
                  // Si hay un error, podemos agregar un placeholder
                  analysts = [...analysts, { 
                    id: user.analystId, 
                    name: "Analista asignado actualmente" 
                  }];
                }
              } catch (analystError) {
                console.error("Error fetching current analyst:", analystError);
                // Agregar placeholder en caso de error
                analysts = [...analysts, { 
                  id: user.analystId, 
                  name: "Analista asignado actualmente" 
                }];
              }
            }
          }
        }
        
        // Ordenar alfabéticamente por nombre
        analysts = analysts.sort((a: QAAnalyst, b: QAAnalyst) => a.name.localeCompare(b.name));
        
        setUnassignedAnalysts(analysts);
      } catch (error) {
        console.error("Error loading analysts:", error);
        toast.error("Error al cargar los analistas disponibles");
      }
    };

    fetchUnassignedAnalysts();
  }, [user, isEditMode]);

  // Handle form submission
  const onSubmit = async (data: UserFormData) => {
    try {
      setIsLoading(true);

      // Remove empty password if no value provided
      const userData = { ...data };
      if (!userData.password) {
        delete userData.password;
      }

      // Create or update user
      const url = isEditMode ? `/api/users/${user!.id}` : "/api/users";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al procesar la solicitud");
      }

      toast.success(isEditMode ? "Usuario actualizado con éxito" : "Usuario creado con éxito");
      reset();
      onSuccess();
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Error al guardar el usuario");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campo de email con icono */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
          Correo electrónico *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="email"
            type="email"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
            placeholder="usuario@empresa.com"
            {...register("email")}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <div className="flex items-center space-x-1 text-red-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{errors.email.message}</span>
          </div>
        )}
      </div>

      {/* Campo de nombre con icono */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
          Nombre completo *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            id="name"
            type="text"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
            placeholder="Juan Pérez"
            {...register("name")}
            disabled={isLoading}
          />
        </div>
        {errors.name && (
          <div className="flex items-center space-x-1 text-red-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{errors.name.message}</span>
          </div>
        )}
      </div>

      {/* Campo de contraseña con icono */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
          {isEditMode ? "Contraseña (opcional)" : "Contraseña *"}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="password"
            type="password"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
            placeholder={isEditMode ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
            {...register("password")}
            disabled={isLoading}
          />
        </div>
        {isEditMode && (
          <p className="text-xs text-gray-500">
            💡 Deja este campo vacío si no deseas cambiar la contraseña actual
          </p>
        )}
        {errors.password && (
          <div className="flex items-center space-x-1 text-red-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{errors.password.message}</span>
          </div>
        )}
      </div>

      {/* Campo de analista con icono mejorado */}
      <div className="space-y-2">
        <label htmlFor="analystId" className="block text-sm font-semibold text-gray-700">
          Analista QA asociado
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <select
            id="analystId"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
            {...register("analystId")}
            disabled={isLoading}
          >
            <option value="">-- Sin analista asignado --</option>
            {unassignedAnalysts.map((analyst) => (
              <option key={analyst.id} value={analyst.id}>
                {analyst.name} {analyst.role && `(${analyst.role})`}
              </option>
            ))}
          </select>
          {/* Icono de dropdown */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          💡 Asocia este usuario con un analista QA para otorgar permisos específicos
        </p>
        {errors.analystId && (
          <div className="flex items-center space-x-1 text-red-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{errors.analystId.message}</span>
          </div>
        )}
      </div>

      {/* Toggle de estado activo mejorado */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                Usuario activo
              </label>
              <p className="text-xs text-gray-500">El usuario podrá iniciar sesión en el sistema</p>
            </div>
          </div>
          <div className="relative">
            <input
              id="isActive"
              type="checkbox"
              className="sr-only"
              {...register("isActive")}
              disabled={isLoading}
            />
            <label
              htmlFor="isActive"
              className={`block w-12 h-6 rounded-full cursor-pointer transition-colors ${
                // Necesitamos acceso al valor del checkbox para el styling
                'bg-blue-500'
              }`}
            >
              <div className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform translate-x-6"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Botones de acción mejorados */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
          disabled={isLoading}
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>
            {isLoading && isEditMode && "Actualizando..."}
            {isLoading && !isEditMode && "Creando..."}
            {!isLoading && isEditMode && "Actualizar Usuario"}
            {!isLoading && !isEditMode && "Crear Usuario"}
          </span>
        </button>
      </div>
    </form>
  );
}
