'use client';

import { useState, useEffect } from "react";
import { QAAnalyst } from "@/models/QAAnalyst";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface CellInfo {
  id: string;
  name: string;
  teamId: string;
}

interface AnalystFormProps {
  analyst?: QAAnalyst;
  onSave?: () => void;
  cells?: CellInfo[];
}

export function AnalystForm({ analyst, onSave, cells: initialCells }: AnalystFormProps) {
  const router = useRouter();
  const [name, setName] = useState(analyst?.name || '');
  const [email, setEmail] = useState(analyst?.email || '');  const [cellIds, setCellIds] = useState<string[]>(analyst?.cellIds || []);
  const [role, setRole] = useState(analyst?.role || '');
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

    const url = '/api/analysts';
    const method = analyst ? 'PUT' : 'POST';      const body = analyst 
      ? JSON.stringify({ id: analyst.id, name, email, cellIds, role })
      : JSON.stringify({ name, email, cellIds, role });

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.ok) {
      if (onSave) {
        onSave();
      } else {
        router.refresh();
      }
      // Cerrar el diálogo
      const closeButton = document.querySelector('[data-dialog-close]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    } else {
      const data = await response.json();
      alert(data.error || 'Error al guardar el analista');
    }
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
      </div>      <div className="space-y-2">
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
      </div>
      <div className="space-y-2">
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
      <Button type="submit">
        {analyst ? 'Guardar Cambios' : 'Crear Analista'}
      </Button>
    </form>
  );
}
