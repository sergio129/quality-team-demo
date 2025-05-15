'use client';

import { useState, useEffect } from "react";
import { Cell } from "@/models/Cell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';

interface TeamInfo {
  id: string;
  name: string;
}

interface CellFormProps {
  cell?: Cell;
  onSave?: () => void;
  onSuccess?: () => void;
  teams?: TeamInfo[];
}

export function CellForm({ cell, onSave, onSuccess, teams: initialTeams }: CellFormProps) {
  const router = useRouter();
  const [name, setName] = useState(cell?.name || '');
  const [teamId, setTeamId] = useState(cell?.teamId || '');
  const [description, setDescription] = useState(cell?.description || '');
  const [teams, setTeams] = useState<TeamInfo[]>(initialTeams || []);

  useEffect(() => {
    if (!initialTeams) {
      fetchTeams();
    }
  }, [initialTeams]);

  const fetchTeams = async () => {
    const response = await fetch('/api/teams');
    const data = await response.json();
    setTeams(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const promise = async () => {
      const url = '/api/cells';
      const method = cell ? 'PUT' : 'POST';
      const body = cell 
        ? JSON.stringify({ id: cell.id, name, teamId, description })
        : JSON.stringify({ name, teamId, description });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar la célula');
      }

      if (onSave) {
        onSave();
      } else {
        router.refresh();
      }

      // Cerrar el diálogo usando el callback
      if (onSuccess) {
        onSuccess();
      }
    };

    toast.promise(promise, {
      loading: cell ? 'Actualizando célula...' : 'Creando célula...',
      success: cell ? 'Célula actualizada exitosamente' : 'Célula creada exitosamente',
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
          placeholder="Nombre de la célula"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="teamId">Equipo</Label>
        <select
          id="teamId"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="">Seleccionar equipo</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción de la célula"
        />
      </div>
      <Button type="submit">
        {cell ? 'Guardar Cambios' : 'Crear Célula'}
      </Button>
    </form>
  );
}
