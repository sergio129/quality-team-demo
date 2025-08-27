'use client';

import { Cell } from "@/models/Cell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTeams, createCell, updateCell, TeamInfo } from "@/hooks/useCells";
import { Users, Building, FileText, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

// Definir el esquema de validación con zod
const cellSchema = z.object({
  name: z.string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(50, { message: 'El nombre no puede exceder 50 caracteres' }),
  teamId: z.string()
    .min(1, { message: 'Debe seleccionar un equipo' }),
  description: z.string()
    .max(500, { message: 'La descripción no puede exceder 500 caracteres' })
    .optional()
    .nullable()
});

// Tipo inferido desde el esquema zod
type CellFormData = z.infer<typeof cellSchema>;

interface CellFormProps {
  cell?: Cell;
  onSave?: () => void;
  onSuccess?: () => void;
  teams?: TeamInfo[];
}

export function CellForm({ cell, onSave, onSuccess, teams: initialTeams }: CellFormProps) {
  const router = useRouter();
  
  // Usar el hook para obtener equipos si no se proporcionaron
  const { teams: fetchedTeams, isLoading } = useTeams();
  const teams = initialTeams || fetchedTeams;
  
  // Configurar react-hook-form con zod
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset
  } = useForm<CellFormData>({
    resolver: zodResolver(cellSchema),
    defaultValues: {
      name: cell?.name || '',
      teamId: cell?.teamId || '',
      description: cell?.description || ''
    }
  });
  
  const onSubmit = async (data: CellFormData) => {
    try {
      if (cell) {
        // Asegurarnos que los tipos coincidan para updateCell
        await updateCell(cell.id, {
          name: data.name,
          teamId: data.teamId,
          description: data.description === null ? undefined : data.description
        });
      } else {
        // Asegurarnos que los tipos coincidan para createCell
        await createCell({
          name: data.name,
          teamId: data.teamId,
          description: data.description === null ? undefined : data.description
        });
        // Resetear el formulario después de un envío exitoso (solo para nuevas células)
        reset();
      }
      
      // Callback adicional si es necesario
      if (onSave) {
        onSave();
      } else {
        router.refresh();
      }

      // Cerrar el diálogo usando el callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error al guardar la célula:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {cell ? <Building className="h-5 w-5 text-blue-600" /> : <Users className="h-5 w-5 text-green-600" />}
            {cell ? 'Editar Célula' : 'Crear Nueva Célula'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {cell ? 'Modifica la información de la célula' : 'Ingresa la información para crear una nueva célula'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-2"
            >
              <Label htmlFor="name" className={`flex items-center gap-2 ${errors.name ? 'text-destructive' : ''}`}>
                <Building className="h-4 w-4" />
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nombre de la célula"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {errors.name.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="space-y-2"
            >
              <Label htmlFor="teamId" className={`flex items-center gap-2 ${errors.teamId ? 'text-destructive' : ''}`}>
                <Users className="h-4 w-4" />
                Equipo <span className="text-destructive">*</span>
              </Label>
              <select
                id="teamId"
                {...register('teamId')}
                className={`flex h-10 w-full rounded-md border ${errors.teamId ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">Seleccionar equipo</option>
                {isLoading ? (
                  <option disabled>Cargando equipos...</option>
                ) : teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.teamId && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {errors.teamId.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="description" className={`flex items-center gap-2 ${errors.description ? 'text-destructive' : ''}`}>
                <FileText className="h-4 w-4" />
                Descripción
              </Label>
              <Textarea
                id="description"
                placeholder="Descripción de la célula (opcional)"
                {...register('description')}
                className={errors.description ? 'border-destructive' : ''}
                rows={3}
              />
              {errors.description && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {errors.description.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="flex justify-end space-x-3 pt-6 border-t"
            >
              {onSuccess && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSuccess}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Guardando...' : cell ? 'Guardar Cambios' : 'Crear Célula'}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
