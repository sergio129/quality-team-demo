'use client';

import { useState, useEffect } from "react";
import { QAAnalyst, Skill, Certification } from "@/models/QAAnalyst";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkillsManager } from "./SkillsManager";
import { CertificationsManager } from "./CertificationsManager";

interface CellInfo {
  id: string;
  name: string;
}

interface AnalystFormProps {
  analyst?: QAAnalyst;
  onSave?: () => void;
  onSuccess?: () => void;
  cells?: CellInfo[];
}

export function AnalystForm({ analyst, onSave, onSuccess, cells: initialCells }: AnalystFormProps) {
  const router = useRouter();  
  const [name, setName] = useState(analyst?.name || '');
  const [email, setEmail] = useState(analyst?.email || '');
  const [cellIds, setCellIds] = useState<string[]>(analyst?.cellIds || []);
  const [role, setRole] = useState(analyst?.role || '');
  const [color, setColor] = useState(analyst?.color || '#3B82F6'); // Color predeterminado: azul
  const [cells, setCells] = useState<CellInfo[]>(initialCells || []);
  const [skills, setSkills] = useState<Skill[]>(analyst?.skills || []);
  const [certifications, setCertifications] = useState<Certification[]>(analyst?.certifications || []);
  const [specialties, setSpecialties] = useState<string[]>(analyst?.specialties || []);
  const [availability, setAvailability] = useState<number>(analyst?.availability || 100);

  useEffect(() => {
    if (!initialCells) {
      fetchCells();
    }
  }, [initialCells]);

  const fetchCells = async () => {
    const response = await fetch('/api/cells');
    const data = await response.json();
    setCells(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const promise = async () => {      
      const url = '/api/analysts';
      const method = analyst ? 'PUT' : 'POST';      
      const body = analyst 
        ? JSON.stringify({ 
            id: analyst.id, 
            name, 
            email, 
            cellIds, 
            role, 
            color,
            skills,
            certifications,
            specialties,
            availability
          })
        : JSON.stringify({ 
            name, 
            email, 
            cellIds, 
            role, 
            color,
            skills,
            certifications,
            specialties,
            availability
          });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar el analista');
      }

      if (onSave) {
        onSave();
      }
      
      router.refresh();

      // Cerrar el diálogo usando el callback
      if (onSuccess) {
        onSuccess();
      }
    };

    toast.promise(promise, {
      loading: analyst ? 'Actualizando analista...' : 'Creando analista...',
      success: analyst ? 'Analista actualizado exitosamente' : 'Analista creado exitosamente',
      error: (err) => err.message
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" className="text-xs py-1">Información</TabsTrigger>
          <TabsTrigger value="skills" className="text-xs py-1">Competencias</TabsTrigger>
          <TabsTrigger value="certs" className="text-xs py-1">Certificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del analista"
                required
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email del analista"
                required
                className="h-8 text-sm"
              />
            </div>
          </div>      

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cells" className="text-xs">Células</Label>
              <select
                id="cells"
                multiple
                value={cellIds}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  setCellIds(selectedOptions);
                }}
                className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {cells.map((cell) => (
                  <option key={cell.id} value={cell.id}>
                    {cell.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">Ctrl/Cmd para múltiples</p>
            </div>      

            <div className="space-y-1">
              <Label htmlFor="role" className="text-xs">Rol</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Seleccionar rol</option>
                <option value="Senior">Senior</option>
                <option value="Semi Senior">Semi Senior</option>
                <option value="Junior">Junior</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="availability" className="text-xs">Disponibilidad</Label>
            <div className="flex items-center space-x-2 h-8">
              <Input 
                id="availability"
                type="range"
                min="0"
                max="100"
                step="5"
                value={availability}
                onChange={(e) => setAvailability(parseInt(e.target.value))}
                className="flex-1 h-2"
              />
              <div className="w-10 text-right text-xs font-medium">{availability}%</div>
            </div>
            <p className="text-xs text-gray-500">Disponibilidad actual para nuevos proyectos</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="color" className="text-xs">Color identificativo</Label>
            <div className="flex items-center gap-2 h-8">
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 min-w-[40px] rounded-md border border-input"
              />
              <Input 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                placeholder="#RRGGBB" 
                className="flex-1 h-8 text-xs"
              />
            </div>
            <p className="text-xs text-gray-500">Color para identificar al analista en el calendario</p>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="specialties" className="text-xs">Especialidades</Label>
            <select
              id="specialties"
              multiple
              value={specialties}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setSpecialties(selected);
              }}
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
            <p className="text-xs text-gray-500">Áreas de especialización técnica</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="skills" className="text-xs">Habilidades técnicas</Label>
            <SkillsManager skills={skills} onChange={setSkills} />
          </div>
        </TabsContent>

        <TabsContent value="certs" className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="certifications" className="text-xs">Certificaciones</Label>
            <CertificationsManager certifications={certifications} onChange={setCertifications} />
          </div>
        </TabsContent>
      </Tabs>

      <Button type="submit" className="w-full h-8 text-sm mt-2">
        {analyst ? 'Guardar Cambios' : 'Crear Analista'}
      </Button>
    </form>
  );
}
