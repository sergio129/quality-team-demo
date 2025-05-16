'use client';

import { QAAnalyst } from '@/models/QAAnalyst';
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
import { EditAnalystDialog } from './EditAnalystDialog';
import { AnalystStatsDialog } from './AnalystStatsDialog';
import { AnalystWorkloadDialog } from './AnalystWorkloadDialog';

interface CellInfo {
  id: string;
  name: string;
  teamId: string;
}

export function DataTable() {
  const [analysts, setAnalysts] = useState<QAAnalyst[]>([]);
  const [cells, setCells] = useState<CellInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAnalysts();
    fetchCells();
  }, []);

  const fetchAnalysts = async () => {
    const response = await fetch('/api/analysts');
    const data = await response.json();
    setAnalysts(data);
  };

  const fetchCells = async () => {
    const response = await fetch('/api/cells');
    const data = await response.json();
    setCells(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este analista?')) return;

    const response = await fetch('/api/analysts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      fetchAnalysts();
    }
  };

  const  getCellNames = (cellIds: string[]) => {
    return cellIds
      .map(id => cells.find(cell => cell.id === id)?.name || 'Célula no encontrada')
      .join(', ');
  };

  const filteredAnalysts = analysts.filter(analyst =>
    analyst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analyst.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analyst.cellIds.some(id => getCellNames([id]).toLowerCase().includes(searchTerm.toLowerCase())) ||
    analyst.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar analistas..."
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
              <TableHead>Email</TableHead>
              <TableHead>Célula</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAnalysts.map((analyst) => (              <TableRow key={analyst.id}>
                <TableCell>{analyst.name}</TableCell>
                <TableCell>{analyst.email}</TableCell>                <TableCell>{getCellNames(analyst.cellIds)}</TableCell>
                <TableCell>{analyst.role}</TableCell>                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <AnalystStatsDialog analyst={analyst} />
                    <AnalystWorkloadDialog analyst={analyst} />
                    <EditAnalystDialog analyst={analyst} onSave={fetchAnalysts} cells={cells} />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(analyst.id)}
                      className="ml-2"
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
