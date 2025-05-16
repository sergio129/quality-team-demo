'use client';

import { useState, useEffect } from "react";
import { QAAnalyst } from "@/models/QAAnalyst";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';

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
  const router = useRouter();  const [name, setName] = useState(analyst?.name || '');
  const [email, setEmail] = useState(analyst?.email || '');
  const [cellIds, setCellIds] = useState<string[]>(analyst?.cellIds || []);
  const [role, setRole] = useState(analyst?.role || '');
  const [color, setColor] = useState(analyst?.color || '#3B82F6'); // Color predeterminado: azul
  const [cells, setCells] = useState<CellInfo[]>(initialCells || []);

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

    const promise = async () => {      const url = '/api/analysts';
      const method = analyst ? 'PUT' : 'POST';
      const body = analyst 
        ? JSON.stringify({ id: analyst.id, name, email, cellIds, role, color })
        : JSON.stringify({ name, email, cellIds, role, color });

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del analista"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email del analista"
          required
        />
      </div>      
      <div className="space-y-2">
        <Label htmlFor="cells">Células</Label>
        <select
          id="cells"
          multiple
          value={cellIds}
          onChange={(e) => {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setCellIds(selectedOptions);
          }}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          {cells.map((cell) => (
            <option key={cell.id} value={cell.id}>
              {cell.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500">Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples células</p>
      </div>      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="">Seleccionar rol</option>
          <option value="Senior">Senior</option>
          <option value="Semi Senior">Semi Senior</option>
          <option value="Junior">Junior</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Color identificativo</Label>
        <div className="flex items-center gap-2">
          <input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 min-w-[50px] rounded-md border border-input"
          />
          <Input 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            placeholder="#RRGGBB" 
            className="flex-1"
          />
        </div>
        <p className="text-sm text-gray-500">Este color se utilizará para identificar al analista en la vista de calendario</p>
      </div>
      <Button type="submit">
        {analyst ? 'Guardar Cambios' : 'Crear Analista'}
      </Button>
    </form>
  );
}
