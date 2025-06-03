'use client';

import { useEffect } from "react";
import { QAAnalyst, Skill, Certification, QARole } from "@/models/QAAnalyst";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkillsManager } from "./SkillsManager";
import { CertificationsManager } from "./CertificationsManager";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createAnalyst, updateAnalyst, CellInfo } from "@/hooks/useAnalysts";

// Esquema de validación con zod
const analystSchema = z.object({  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
  email: z.string().email({ message: 'Ingrese un correo electrónico válido' }),
  cellIds: z.array(z.string()).min(1, { message: 'Debe seleccionar al menos una célula' }),
  role: z.enum(['QA Analyst', 'QA Senior', 'QA Leader'], { 
    required_error: 'Debe seleccionar un rol',
    invalid_type_error: 'Rol inválido'
  }),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, { message: 'Color inválido, debe ser formato hexadecimal' }).optional(),
  skills: z.array(
    z.object({
      name: z.string().min(1),
      level: z.enum(['Básico', 'Intermedio', 'Avanzado', 'Experto'])
    })
  ).optional(),
  certifications: z.array(
    z.object({
      name: z.string().min(1),
      issuer: z.string().min(1),
      date: z.string(),
      expiryDate: z.string().optional()
    })
  ).optional(),
  specialties: z.array(z.string()).optional(),
  availability: z.number().min(0).max(100).optional()
});

type AnalystFormValues = z.infer<typeof analystSchema>;

interface AnalystFormProps {
  analyst?: QAAnalyst;
  onSuccess?: () => void;
  cells?: CellInfo[];
}

export function AnalystForm({ analyst, onSuccess, cells: initialCells }: AnalystFormProps) {
  const router = useRouter();
  
  // Configurar react-hook-form con validación zod
  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors, isSubmitting },
    setValue
  } = useForm<AnalystFormValues>({
    resolver: zodResolver(analystSchema),
    defaultValues: {
      name: analyst?.name || '',
      email: analyst?.email || '',
      cellIds: analyst?.cellIds || [],
      role: analyst?.role || '',
      color: analyst?.color || '#3B82F6',
      skills: analyst?.skills || [],
      certifications: analyst?.certifications || [],
      specialties: analyst?.specialties || [],
      availability: analyst?.availability || 100
    }
  });

  const onSubmit = async (data: AnalystFormValues) => {
    if (analyst) {
      await updateAnalyst(analyst.id, data);
    } else {
      await createAnalyst(data);
    }
    
    router.refresh();
    
    if (onSuccess) {
      onSuccess();
    }  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" className="text-xs py-1">Información</TabsTrigger>
          <TabsTrigger value="skills" className="text-xs py-1">Competencias</TabsTrigger>
          <TabsTrigger value="certs" className="text-xs py-1">Certificaciones</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">Nombre</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Nombre del analista"
                className="h-8 text-sm"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Email del analista"
                className="h-8 text-sm"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>      

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cellIds" className="text-xs">Células</Label>
              <Controller
                name="cellIds"
                control={control}
                render={({ field }) => (
                  <select
                    id="cellIds"
                    multiple
                    onChange={(e) => {
                      const selectedOptions = Array.from(
                        e.target.selectedOptions, 
                        option => option.value
                      );
                      field.onChange(selectedOptions);
                    }}
                    value={field.value}
                    className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {initialCells && initialCells.map((cell) => (
                      <option key={cell.id} value={cell.id}>
                        {cell.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.cellIds && (
                <p className="text-xs text-red-500 mt-1">{errors.cellIds.message}</p>
              )}
              <p className="text-xs text-gray-500">Ctrl/Cmd para múltiples</p>
            </div>      

            <div className="space-y-1">
              <Label htmlFor="role" className="text-xs">Rol</Label>              <select
                id="role"
                {...register('role')}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Seleccionar rol</option>
                <option value="QA Analyst">QA Analyst</option>
                <option value="QA Senior">QA Senior</option>
                <option value="QA Leader">QA Leader</option>
              </select>
              {errors.role && (
                <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="availability" className="text-xs">Disponibilidad</Label>
            <div className="flex items-center space-x-2 h-8">
              <Controller
                name="availability"
                control={control}
                render={({ field }) => (
                  <>
                    <Input 
                      id="availability"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="flex-1 h-2"
                    />
                    <div className="w-10 text-right text-xs font-medium">{field.value}%</div>
                  </>
                )}
              />
            </div>
            <p className="text-xs text-gray-500">Disponibilidad actual para nuevos proyectos</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="color" className="text-xs">Color identificativo</Label>
            <div className="flex items-center gap-2 h-8">
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <>
                    <input
                      id="color-picker"
                      type="color"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-8 min-w-[40px] rounded-md border border-input"
                    />
                    <Input 
                      id="color"
                      value={field.value} 
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="#RRGGBB" 
                      className="flex-1 h-8 text-xs"
                    />
                  </>
                )}
              />
            </div>
            {errors.color && (
              <p className="text-xs text-red-500 mt-1">{errors.color.message}</p>
            )}
            <p className="text-xs text-gray-500">Color para identificar al analista en el calendario</p>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="specialties" className="text-xs">Especialidades</Label>
            <Controller
              name="specialties"
              control={control}
              render={({ field }) => (
                <select
                  id="specialties"
                  multiple
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions, 
                      option => option.value
                    );
                    field.onChange(selected);
                  }}
                  value={field.value}
                  className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Mobile">Mobile</option>
                  <option value="APIs">Servicios/APIs</option>
                  <option value="Bases de Datos">Bases de Datos</option>
                  <option value="Automatización">Automatización</option>
                  <option value="Performance">Performance</option>
                  <option value="Seguridad">Seguridad</option>
                </select>
              )}
            />
            <p className="text-xs text-gray-500">Áreas de especialización técnica</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="skills" className="text-xs">Habilidades técnicas</Label>
            <Controller
              name="skills"
              control={control}
              render={({ field }) => (
                <SkillsManager skills={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="certs" className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="certifications" className="text-xs">Certificaciones</Label>
            <Controller
              name="certifications"
              control={control}
              render={({ field }) => (
                <CertificationsManager certifications={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Button 
        type="submit" 
        className="w-full h-8 text-sm mt-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Guardando...' : analyst ? 'Guardar Cambios' : 'Crear Analista'}
      </Button>
    </form>
  );
}
