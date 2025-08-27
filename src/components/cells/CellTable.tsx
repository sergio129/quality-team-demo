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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditCellDialog } from './EditCellDialog';
import { CellProjectsDialog } from './CellProjectsDialog';
import { toast } from 'sonner';
import { useCells, useTeams, deleteCell, TeamInfo } from '@/hooks/useCells';
import { useProjects } from '@/hooks/useProjects';
import {
  Grid,
  List,
  FolderOpen,
  Edit,
  Users,
  Briefcase,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

// Definir tipos para el ordenamiento
type SortField = keyof Pick<Cell, 'name' | 'description'> | 'team';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'cards' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive';

export function DataTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [isProjectsDialogOpen, setIsProjectsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Usar SWR para obtener datos
  const { cells, isLoading: cellsLoading, isError: cellsError } = useCells();
  const { teams, isLoading: teamsLoading } = useTeams();
  const { projects } = useProjects();

  const isLoading = cellsLoading || teamsLoading;
  const isError = cellsError;

  // Función para determinar el estado de una cédula
  const getCellStatus = useCallback((cell: Cell) => {
    if (!projects || projects.length === 0) return { status: 'inactive', color: 'gray', label: 'Sin proyectos', variant: 'secondary' as const };
    
    const projectCount = projects.filter(project => 
      project.celula?.toLowerCase() === cell.name.toLowerCase()
    ).length;
    
    if (projectCount === 0) return { status: 'inactive', color: 'gray', label: 'Sin proyectos', variant: 'secondary' as const };
    if (projectCount < 3) return { status: 'low', color: 'yellow', label: 'Actividad baja', variant: 'outline' as const };
    if (projectCount < 7) return { status: 'medium', color: 'blue', label: 'Actividad media', variant: 'default' as const };
    return { status: 'high', color: 'green', label: 'Alta actividad', variant: 'default' as const };
  }, [projects]);

  // Función para obtener estadísticas generales
  const getStats = useCallback(() => {
    const totalCells = cells.length;
    const totalTeams = teams.length;
    const totalProjects = projects.length;
    
    const activeCells = cells.filter(cell => {
      if (!projects || projects.length === 0) return false;
      return projects.some(project => 
        project.celula?.toLowerCase() === cell.name.toLowerCase()
      );
    }).length;

    return { totalCells, totalTeams, totalProjects, activeCells };
  }, [cells, teams, projects]);

  useEffect(() => {
    // Resetear a la primera página cuando cambia el término de búsqueda o filtros
    setCurrentPage(1);
  }, [searchTerm, teamFilter, statusFilter]);

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
      
      // Filtro de búsqueda
      const matchesSearch = cell.name.toLowerCase().includes(searchLower) ||
        teamName.includes(searchLower) ||
        cell.description?.toLowerCase().includes(searchLower);
      
      // Filtro de equipo
      const matchesTeam = teamFilter === 'all' || cell.teamId === teamFilter;
      
      // Filtro de estado
      const cellStatus = getCellStatus(cell);
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && cellStatus.status !== 'inactive') ||
        (statusFilter === 'inactive' && cellStatus.status === 'inactive');
      
      return matchesSearch && matchesTeam && matchesStatus;
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
  }, [cells, teams, sortField, sortDirection, searchTerm, teamFilter, statusFilter, getTeamName, getCellStatus]);

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

  // Función para abrir el diálogo de proyectos para una célula
  const handleViewProjects = useCallback((cell: Cell) => {
    setSelectedCell(cell);
    setIsProjectsDialogOpen(true);
  }, []);

  // Función para cerrar el diálogo de proyectos
  const handleCloseProjectsDialog = useCallback(() => {
    setIsProjectsDialogOpen(false);
    setSelectedCell(null);
  }, []);

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cédulas de Desarrollo</h1>
            <p className="text-blue-100">Gestión de equipos y proyectos</p>
          </div>
          <div className="flex space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalCells}</div>
              <div className="text-sm text-blue-100">Total Cédulas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.activeCells}</div>
              <div className="text-sm text-blue-100">Cédulas Activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalTeams}</div>
              <div className="text-sm text-blue-100">Equipos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <div className="text-sm text-blue-100">Proyectos</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controles de búsqueda y filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white p-4 rounded-lg border shadow-sm"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, equipo o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={teamFilter} onValueChange={(value) => setTeamFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los equipos</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Cédulas activas</SelectItem>
                <SelectItem value="inactive">Cédulas inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 hidden sm:inline">Vista:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {selectedCell && (
        <CellProjectsDialog
          cell={selectedCell}
          isOpen={isProjectsDialogOpen}
          onClose={handleCloseProjectsDialog}
        />
      )}

      {/* Contenido principal */}
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="flex justify-between mt-4">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : isError ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 text-center"
        >
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
        </motion.div>
      ) : filteredAndSortedCells.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-12 rounded-lg border border-dashed bg-gray-50"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <FolderOpen className="h-8 w-8 text-gray-400" />
          </div>
          {searchTerm || teamFilter !== 'all' || statusFilter !== 'all' ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron células</h3>
              <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay células registradas</h3>
              <p className="text-gray-500 mb-4">Comience creando una nueva célula</p>
            </>
          )}
        </motion.div>
      ) : (
        <div className="text-center p-8">
          <p>Contenido en desarrollo...</p>
        </div>
      )}
    </div>
  );
}
