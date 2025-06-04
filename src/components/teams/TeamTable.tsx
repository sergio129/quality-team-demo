'use client';

import { Team } from '@/models/Team';
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
import { EditTeamDialog } from './EditTeamDialog';
import { TeamMembersDialog } from './TeamMembersDialog';
import { TeamProjectsDialog } from './TeamProjectsDialog';
import { TeamFilter } from './TeamFilter';
import { ExportTeams } from './ExportTeams';
import { toast } from 'sonner';
import { useTeams, deleteTeam } from '@/hooks/useTeams';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useProjects } from '@/hooks/useProjects';

// Definir tipos para el ordenamiento
type SortField = keyof Pick<Team, 'name' | 'description'>;
type SortDirection = 'asc' | 'desc';

export function DataTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isProjectsDialogOpen, setIsProjectsDialogOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Usar SWR para obtener datos
  const { teams, isLoading, isError, error } = useTeams();
  const { analysts } = useAnalysts();
  const { projects } = useProjects(); // Obtener proyectos para calcular carga de trabajo

  useEffect(() => {
    // Resetear a la primera página cuando cambia el término de búsqueda
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDelete = useCallback(async (id: string) => {
    toast.error('¿Eliminar equipo?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          await deleteTeam(id);
        },
      },
    });
  }, []);
  
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
    // Filtramos y ordenamos equipos con useMemo para optimizar
  const filteredAndSortedTeams = useMemo(() => {
    if (!teams) return [];
    
    // Primero ordenamos
    const sortedData = [...teams].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
    
    // Aplicamos filtros por estado de proyectos
    let filteredByStatus = sortedData;
    if (currentFilter !== 'all') {
      filteredByStatus = sortedData.filter(team => {
        const teamProjects = projects.filter(p => p.equipo === team.name);
        
        switch (currentFilter) {
          case 'active':
            return teamProjects.some(p => 
              p.estadoCalculado === 'En Progreso' || 
              p.estado?.toLowerCase().includes('progreso')
            );
          case 'delayed':
            return teamProjects.some(p => 
              p.estado?.toLowerCase() === 'retrasado' ||
              (p.diasRetraso && p.diasRetraso > 0)
            );
          case 'empty':
            return teamProjects.length === 0;
          default:
            return true;
        }
      });
    }
    
    // Luego filtramos por búsqueda
    return filteredByStatus.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [teams, sortField, sortDirection, searchTerm, currentFilter, projects]);

  // Calcula la carga de trabajo para cada equipo
  const getTeamWorkload = useCallback((teamName: string) => {
    // Contar proyectos activos asignados al equipo
    return projects.filter(project => 
      project.equipo === teamName && 
      (project.estadoCalculado === 'En Progreso' || project.estado === 'en progreso')
    ).length;
  }, [projects]);

  // Lógica de paginación
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(filteredAndSortedTeams.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTeams = filteredAndSortedTeams.slice(indexOfFirstItem, indexOfLastItem);
    
    return { 
      totalPages, 
      indexOfLastItem, 
      indexOfFirstItem, 
      currentTeams 
    };
  }, [filteredAndSortedTeams, currentPage, itemsPerPage]);
  
  // Renderizar ícono de ordenamiento
  const renderSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return sortDirection === 'asc' 
      ? <span className="text-blue-600 ml-1">↑</span> 
      : <span className="text-blue-600 ml-1">↓</span>;
  }, [sortField, sortDirection]);

  const handleOpenMembersDialog = useCallback((team: Team) => {
    setSelectedTeam(team);
    setIsMembersDialogOpen(true);
  }, []);

  const handleCloseMembersDialog = useCallback(() => {
    setIsMembersDialogOpen(false);
    setSelectedTeam(null);
  }, []);

  const handleOpenProjectsDialog = useCallback((team: Team) => {
    setSelectedTeam(team);
    setIsProjectsDialogOpen(true);
  }, []);

  const handleCloseProjectsDialog = useCallback(() => {
    setIsProjectsDialogOpen(false);
    setSelectedTeam(null);
  }, []);
  const handleFilterChange = useCallback((filter: string) => {
    setCurrentFilter(filter);
    setCurrentPage(1); // Resetear a la primera página cuando cambia el filtro
  }, []);

  return (
    <div>
      {selectedTeam && (
        <>
          <TeamMembersDialog
            team={selectedTeam}
            isOpen={isMembersDialogOpen}
            onClose={handleCloseMembersDialog}
          />
          <TeamProjectsDialog
            team={selectedTeam}
            isOpen={isProjectsDialogOpen}
            onClose={handleCloseProjectsDialog}
          />
        </>
      )}      <div className="flex flex-col md:flex-row justify-between gap-4 py-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <ExportTeams teams={filteredAndSortedTeams} />
        </div>
        <TeamFilter 
          onFilterChange={handleFilterChange}
          currentFilter={currentFilter}
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
            No se pudieron cargar los equipos. Por favor, intente de nuevo.
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error?.message || 'Error de conexión'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Intentar de nuevo
          </Button>
        </div>
      ) : filteredAndSortedTeams.length === 0 ? (
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
      ) : (        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      Nombre {renderSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('description')}>
                    <div className="flex items-center">
                      Descripción {renderSortIcon('description')}
                    </div>
                  </TableHead>
                  <TableHead>Miembros</TableHead>
                  <TableHead>Carga de trabajo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginationInfo.currentTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {team.members && team.members.length > 0 ? (
                          <>
                            {team.members.slice(0, 3).map(memberId => {
                              const analyst = analysts.find(a => a.id === memberId);
                              return (
                                <span 
                                  key={memberId}
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                  title={analyst?.name || "Analista"}
                                >
                                  {analyst?.name?.split(' ')[0] || "Analista"}
                                </span>
                              );
                            })}
                            {team.members.length > 3 && (
                              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                +{team.members.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin miembros</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="mr-2 w-16 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              getTeamWorkload(team.name) > 5 
                                ? 'bg-red-500' 
                                : getTeamWorkload(team.name) > 3 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                            }`} 
                            style={{ width: `${Math.min(100, getTeamWorkload(team.name) * 20)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">
                          {getTeamWorkload(team.name)} proyecto{getTeamWorkload(team.name) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleOpenProjectsDialog(team)}
                      >
                        Ver Proyectos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleOpenMembersDialog(team)}
                      >
                        Asignar Miembros
                      </Button>
                      <EditTeamDialog team={team} />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(team.id)}
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
                Mostrando {paginationInfo.indexOfFirstItem + 1}-{Math.min(paginationInfo.indexOfLastItem, filteredAndSortedTeams.length)} de {filteredAndSortedTeams.length} equipos
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
