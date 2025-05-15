'use client';

import { Cell } from '@/models/Cell';
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
import { EditCellDialog } from './EditCellDialog';

interface TeamInfo {
  id: string;
  name: string;
}

export function DataTable() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCells();
    fetchTeams();
  }, []);

  const fetchCells = async () => {
    const response = await fetch('/api/cells');
    const data = await response.json();
    setCells(data);
  };

  const fetchTeams = async () => {
    const response = await fetch('/api/teams');
    const data = await response.json();
    setTeams(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta célula?')) return;

    const response = await fetch('/api/cells', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      fetchCells();
    }
  };

  const getTeamName = (teamId: string) => {
    return teams.find(team => team.id === teamId)?.name || 'Equipo no encontrado';
  };

  const filteredCells = cells.filter(cell =>
    cell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTeamName(cell.teamId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    cell.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar células..."
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
              <TableHead>Equipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCells.map((cell) => (
              <TableRow key={cell.id}>
                <TableCell>{cell.name}</TableCell>
                <TableCell>{getTeamName(cell.teamId)}</TableCell>
                <TableCell>{cell.description}</TableCell>
                <TableCell className="text-right">
                  <EditCellDialog cell={cell} onSave={fetchCells} teams={teams} />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(cell.id)}
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
