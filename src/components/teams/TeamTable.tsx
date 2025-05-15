'use client';

import { Team } from '@/models/Team';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { EditTeamDialog } from './EditTeamDialog';
import { toast } from 'sonner';

export function DataTable() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const response = await fetch('/api/teams');
    const data = await response.json();
    setTeams(data);
  };
  const handleDelete = async (id: string) => {
    toast.promise(
      async () => {
        const response = await fetch('/api/teams', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error('Error al eliminar el equipo');
        }

        fetchTeams();
      },
      {
        loading: 'Eliminando equipo...',
        success: 'Equipo eliminado exitosamente',
        error: 'No se pudo eliminar el equipo'
      }
    );
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar equipos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>{team.name}</TableCell>
                <TableCell>{team.description}</TableCell>
                <TableCell className="text-right">
                  <EditTeamDialog team={team} onSave={fetchTeams} />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      toast.error('¿Eliminar equipo?', {
                        action: {
                          label: 'Eliminar',
                          onClick: () => handleDelete(team.id)
                        },
                      });
                    }}
                    className="ml-2"
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
