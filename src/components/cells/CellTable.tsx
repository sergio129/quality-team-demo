'use client';

import { Cell } from '@/models/Cell';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { toast } from 'sonner';
import { useCells, useTeams, deleteCell, TeamInfo } from '@/hooks/useCells';

// Definir tipos para el ordenamiento
type SortField = keyof Pick<Cell, 'name' | 'description'> | 'team';
type SortDirection = 'asc' | 'desc';

export function DataTable() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Usar SWR para obtener datos
  const { cells, isLoading: cellsLoading, isError: cellsError } = useCells();
  const { teams, isLoading: teamsLoading } = useTeams();

  const isLoading = cellsLoading || teamsLoading;
  const isError = cellsError;

  useEffect(() => {
    // Resetear a la primera página cuando cambia el término de búsqueda
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDelete = useCallback(async (id: string) => {
    toast.error('¿Eliminar célula?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          await deleteCell(id);
        },
      },
    });
  }, []);

  // Función para obtener el nombre del equipo
  const getTeamName = useCallback((teamId: string) => {
    return teams.find(team => team.id === teamId)?.name || 'Equipo no asignado';
  }, [teams]);
  
  // Función para manejar el ordenamiento
  const handleSort = useCallback((field: SortField) => {
    setSortField(prevField => {
      if (prevField === field) {
        // Si hacemos clic en el mismo campo, invertir dirección
        setSortDirection(prevDir => prevDir === 'asc' ? 'desc' : 'asc');
        return prevField;
      } else {
        // Si cambiamos de campo, establecer el nuevo campo y dirección ascendente
        setSortDirection('asc');
        return field;
      }
    });
  }, []);
  
  // Filtramos y ordenamos células con useMemo para optimizar
  const filteredAndSortedCells = useMemo(() => {
    if (!cells || cells.length === 0) return [];
    
    // Primero filtramos
    const filtered = cells.filter(cell => {
      const teamName = getTeamName(cell.teamId).toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      return cell.name.toLowerCase().includes(searchLower) ||
        teamName.includes(searchLower) ||
        cell.description?.toLowerCase().includes(searchLower);
    });
    
    // Luego ordenamos
    return [...filtered].sort((a, b) => {
      let aValue;
      let bValue;
      
      if (sortField === 'team') {
        aValue = getTeamName(a.teamId);
        bValue = getTeamName(b.teamId);
      } else {
        aValue = a[sortField] || '';
        bValue = b[sortField] || '';
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
  }, [cells, teams, sortField, sortDirection, searchTerm, getTeamName]);

  // Lógica de paginación
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(filteredAndSortedCells.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCells = filteredAndSortedCells.slice(indexOfFirstItem, indexOfLastItem);
    
    return { 
      totalPages, 
      indexOfLastItem, 
      indexOfFirstItem, 
      currentCells 
    };
  }, [filteredAndSortedCells, currentPage, itemsPerPage]);
  
  // Renderizar ícono de ordenamiento
  const renderSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return sortDirection === 'asc' 
      ? <span className="text-blue-600 ml-1">↑</span> 
      : <span className="text-blue-600 ml-1">↓</span>;
  }, [sortField, sortDirection]);

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
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No se pudieron cargar las células. Por favor, intente de nuevo.
          </h3>
          <Button onClick={() => window.location.reload()}>
            Intentar de nuevo
          </Button>
        </div>
      ) : filteredAndSortedCells.length === 0 ? (
        <div className="text-center p-8 rounded-lg border border-dashed">
          {searchTerm ? (
            <p className="text-gray-500">No se encontraron células que coincidan con su búsqueda</p>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay células registradas</h3>
              <p className="text-gray-500 mb-4">Comience creando una nueva célula</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Nombre {renderSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('team')}
                  >
                    <div className="flex items-center">
                      Equipo {renderSortIcon('team')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center">
                      Descripción {renderSortIcon('description')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginationInfo.currentCells.map((cell) => (
                  <TableRow key={cell.id}>
                    <TableCell className="font-medium">{cell.name}</TableCell>
                    <TableCell>{getTeamName(cell.teamId)}</TableCell>
                    <TableCell>{cell.description}</TableCell>
                    <TableCell className="text-right">
                      <EditCellDialog cell={cell} teams={teams} />
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
          
          {/* Controles de paginación */}
          {paginationInfo.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {paginationInfo.indexOfFirstItem + 1}-{Math.min(paginationInfo.indexOfLastItem, filteredAndSortedCells.length)} de {filteredAndSortedCells.length} células
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(paginationInfo.totalPages, 5))].map((_, idx) => {
                    // Lógica para mostrar números de página alrededor de la página actual
                    let pageNumber;
                    if (paginationInfo.totalPages <= 5) {
                      pageNumber = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = idx + 1;
                    } else if (currentPage >= paginationInfo.totalPages - 2) {
                      pageNumber = paginationInfo.totalPages - 4 + idx;
                    } else {
                      pageNumber = currentPage - 2 + idx;
                    }
                    
                    return (
                      <Button 
                        key={idx}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        className="w-8"
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === paginationInfo.totalPages || paginationInfo.totalPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(paginationInfo.totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
