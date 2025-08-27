'use client';

import { Team } from "@/models/Team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTeam, updateTeam } from "@/hooks/useTeams";
import { toast } from "sonner";

// Esquema de validación con Zod
const teamSchema = z.object({
  name: z.string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(50, { message: "El nombre no puede exceder 50 caracteres" }),
  description: z.string()
    .max(500, { message: "La descripción no puede exceder 500 caracteres" })
    .optional()
    .nullable(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: "El color debe ser un código hexadecimal válido (#RRGGBB)" })
    .optional()
    .nullable()
});

// Tipo inferido desde el esquema
type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormProps {
  team?: Team;
  onSave?: () => void;
  onSuccess?: () => void;
}

export function TeamForm({ team, onSave, onSuccess }: TeamFormProps) {
  const router = useRouter();

  // Inicializar useForm con zodResolver
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3B82F6",
    },
  });

  // Resetear el formulario cuando se edite un equipo
  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        description: team.description || "",
        color: team.color || "#3B82F6",
      });
    }
  }, [team, reset]);

  const onSubmit = async (data: TeamFormData) => {
    try {
      if (team) {
        await updateTeam(team.id, {
          name: data.name,
          description: data.description ?? undefined,
          color: data.color ?? undefined,
        });
      } else {
        await createTeam({
          name: data.name,
          description: data.description ?? undefined,
          color: data.color ?? undefined,
        });
        reset(); // limpiar formulario si es nuevo
      }

      if (onSave) {
        onSave();
      } else {
        router.refresh();
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error al guardar el equipo:", error);
      toast.error("Ha ocurrido un error al guardar el equipo");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ingrese el nombre del equipo"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
          aria-invalid={errors.name ? "true" : "false"}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description" className={errors.description ? "text-destructive" : ""}>
          Descripción
        </Label>
        <Textarea
          id="description"
          placeholder="Ingrese la descripción del equipo"
          {...register("description")}
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label htmlFor="color" className={errors.color ? "text-destructive" : ""}>
          Color del Equipo
        </Label>
        <Controller
          name="color"
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={value || "#3B82F6"}
                onChange={(e) => onChange(e.target.value)}
                className={`w-16 h-10 p-1 border rounded cursor-pointer ${errors.color ? "border-destructive" : ""}`}
              />
              <Input
                type="text"
                placeholder="#3B82F6"
                value={value || "#3B82F6"}
                onChange={(e) => onChange(e.target.value)}
                className={`flex-1 font-mono text-sm ${errors.color ? "border-destructive" : ""}`}
              />
            </div>
          )}
        />
        {errors.color && (
          <p className="text-sm text-destructive">{errors.color.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Selecciona un color característico para identificar visualmente este equipo
        </p>
      </div>

      {/* Botón */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : team ? "Guardar Cambios" : "Crear Equipo"}
      </Button>
    </form>
  );
}
