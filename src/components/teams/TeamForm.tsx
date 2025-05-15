'use client';

import { useState } from "react";
import { Team } from "@/models/Team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';

interface TeamFormProps {
  team?: Team;
  onSave?: () => void;
}

export function TeamForm({ team, onSave }: TeamFormProps) {
  const router = useRouter();
  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const promise = async () => {
      const url = '/api/teams';
      const method = team ? 'PUT' : 'POST';
      const body = team 
        ? JSON.stringify({ id: team.id, name, description })
        : JSON.stringify({ name, description });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        throw new Error('Error al guardar el equipo');
      }

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
    };

    toast.promise(promise, {
      loading: team ? 'Actualizando equipo...' : 'Creando equipo...',
      success: team ? 'Equipo actualizado exitosamente' : 'Equipo creado exitosamente',
      error: team ? 'Error al actualizar el equipo' : 'Error al crear el equipo'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ingrese el nombre del equipo"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ingrese la descripción del equipo"
        />
      </div>
      <Button type="submit">
        {team ? 'Guardar Cambios' : 'Crear Equipo'}
      </Button>
    </form>
  );
}
