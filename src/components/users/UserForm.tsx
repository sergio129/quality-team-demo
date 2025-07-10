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
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register("email")}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          id="name"
          type="text"
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register("name")}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {isEditMode ? "Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
        </label>
        <input
          id="password"
          type="password"
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={isEditMode ? "••••••••" : ""}
          {...register("password")}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="analystId" className="block text-sm font-medium text-gray-700">
          Analista QA asociado
        </label>
        <select
          id="analystId"
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register("analystId")}
          disabled={isLoading}
        >
          <option value="">-- Seleccionar analista --</option>
          {unassignedAnalysts.map((analyst) => (
            <option key={analyst.id} value={analyst.id}>
              {analyst.name}
            </option>
          ))}
        </select>
        {errors.analystId && (
          <p className="mt-1 text-sm text-red-600">{errors.analystId.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="isActive"
          type="checkbox"
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          {...register("isActive")}
          disabled={isLoading}
        />
        <label htmlFor="isActive" className="block ml-2 text-sm text-gray-700">
          Usuario activo
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading && isEditMode && "Actualizando..."}
          {isLoading && !isEditMode && "Creando..."}
          {!isLoading && isEditMode && "Actualizar usuario"}
          {!isLoading && !isEditMode && "Crear usuario"}
        </button>
      </div>
    </form>
  );
}
