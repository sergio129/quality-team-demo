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

// Definir tipos para el ordenamiento
type SortField = keyof Pick<Team, 'name' | 'description'>;
type SortDirection = 'asc' | 'desc';

export function DataTable() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    // Resetear a la primera página cuando cambia el término de búsqueda
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/teams');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      setError('No se pudieron cargar los equipos. Por favor, intente de nuevo.');
      console.error('Error fetching teams:', err);
    } finally {
      setIsLoading(false);
    }
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
  
  // Función para manejar el ordenamiento
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Si hacemos clic en el mismo campo, invertir dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Si cambiamos de campo, establecer el nuevo campo y dirección ascendente
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Ordenar equipos basados en el campo y dirección actual
  const sortedTeams = [...teams].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    return 0;
  });

  // Filtrar equipos después de ordenar
  const filteredTeams = sortedTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Lógica de paginación
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTeams = filteredTeams.slice(indexOfFirstItem, indexOfLastItem);
  
  // Renderizar ícono de ordenamiento
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return sortDirection === 'asc' 
      ? <span className="text-blue-600 ml-1">↑</span> 
      : <span className="text-blue-600 ml-1">↓</span>;
  };

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar equipos..."
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
      ) : error ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">{error}</h3>
          <Button onClick={fetchTeams} className="mt-4">Intentar de nuevo</Button>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center p-8 rounded-lg border border-dashed">
          {searchTerm ? (
            <p className="text-gray-500">No se encontraron equipos que coincidan con su búsqueda</p>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay equipos registrados</h3>
              <p className="text-gray-500 mb-4">Comience creando un nuevo equipo</p>
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
                {currentTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
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
          
          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTeams.length)} de {filteredTeams.length} equipos
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
                  {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                    // Lógica para mostrar números de página alrededor de la página actual
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + idx;
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
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
