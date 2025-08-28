'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTestPlans, createTestPlan } from '@/hooks/useTestCases';
import { useProjects, useAllProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { mutate } from 'swr';
import { Trash2, Search, Filter, Star, StarOff, ChevronLeft, ChevronRight } from 'lucide-react';
import UpdateQualityButton from './UpdateQualityButton';
import QualityInfoButton from './QualityInfoButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { TestPlan } from '@/models/TestCase';

// Función para formatear fechas evitando problemas de zona horaria
function formatDateWithoutTimezone(dateString: string): string {
  try {
    // Intentar crear un objeto Date
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      // Si el formato es como "22T00:00:00.000Z/05/2025", intenta extraer las partes
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parts[0].split('T')[0];
          const month = parts[1];
          const year = parts[2];
          return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
      }
      // Si no se puede procesar el formato especial, devolver la cadena original
      return dateString;
    }
    
    // Formatear como DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return dateString;
  }
}

interface TestCasePlanManagerProps {
  onPlanSelected: (planId: string) => void;
}

export default function TestCasePlanManager({ onPlanSelected }: TestCasePlanManagerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const { projects } = useAllProjects();
  const { testPlans, isLoading } = useTestPlans();
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<TestPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<TestPlan | null>(null);
  const [newTestPlan, setNewTestPlan] = useState<Partial<TestPlan>>({
    projectId: '',
    projectName: '',
    codeReference: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    estimatedHours: 0,
    estimatedDays: 0,
    totalCases: 0,
    cycles: [{ id: uuidv4(), number: 1, designed: 0, successful: 0, notExecuted: 0, defects: 0 }],
    testQuality: 100
  });
  // Estado para la búsqueda de proyectos en el modal de creación
  const [searchProjectTerm, setSearchProjectTerm] = useState('');
  // Estados para búsqueda y filtrado avanzados
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [plansPerPage] = useState(10);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    qualityFrom: 0,
    qualityTo: 100,
    hasCases: false
  });
  const [sortBy, setSortBy] = useState<{field: string, direction: 'asc' | 'desc'}>({
    field: 'updatedAt', 
    direction: 'desc'
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Filtrar y ordenar proyectos que tienen planes de prueba
  const projectsWithPlans = projects
    .filter(project => testPlans?.some(plan => plan.projectId === project.idJira))
    .sort((a, b) => {
      // Primero ordenar por fecha de entrega (próximos primero)
      const dateA = a.fechaEntrega ? new Date(a.fechaEntrega).getTime() : Infinity;
      const dateB = b.fechaEntrega ? new Date(b.fechaEntrega).getTime() : Infinity;
      
      if (dateA !== dateB) return dateA - dateB;
      
      // Si las fechas son iguales, ordenar por nombre del proyecto
      return (a.proyecto || '').localeCompare(b.proyecto || '');
    });

  // Recuperar favoritos del localStorage al cargar
  useEffect(() => {
    const savedFavorites = localStorage.getItem('testPlanFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error parsing favorites from localStorage:', e);
      }
    }
  }, []);  // Usar useMemo en lugar de useEffect para calcular los planes filtrados
  // Esto evita el bucle infinito de actualizaciones
  const filteredPlans = useMemo(() => {
    if (!testPlans) {
      return [];
    }

    // Primero filtrar por proyecto seleccionado
    let filtered = selectedProjectId 
      ? testPlans.filter(plan => plan.projectId === selectedProjectId)
      : [...testPlans];
    
    // Luego aplicar filtro de búsqueda por texto
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(plan => 
        plan.codeReference.toLowerCase().includes(search) || 
        plan.projectName.toLowerCase().includes(search)
      );
    }
    
    // Aplicar filtros avanzados si están activados
    if (advancedFiltersOpen) {
      if (filters.dateFrom) {
        filtered = filtered.filter(plan => new Date(plan.startDate) >= new Date(filters.dateFrom));
      }
      
      if (filters.dateTo) {
        filtered = filtered.filter(plan => new Date(plan.startDate) <= new Date(filters.dateTo));
      }
      
      filtered = filtered.filter(plan => 
        plan.testQuality >= filters.qualityFrom && 
        plan.testQuality <= filters.qualityTo
      );
      
      if (filters.hasCases) {
        filtered = filtered.filter(plan => plan.totalCases > 0);
      }
    }

    // Aplicar filtro de favoritos si está activado
    if (showOnlyFavorites) {
      filtered = filtered.filter(plan => favorites.includes(plan.id));
    }
    
    // Ordenar los resultados
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      // Obtener valores a comparar según el campo seleccionado
      switch (sortBy.field) {
        case 'codeReference':
          valueA = a.codeReference;
          valueB = b.codeReference;
          break;
        case 'projectName':
          valueA = a.projectName;
          valueB = b.projectName;
          break;
        case 'startDate':
          valueA = new Date(a.startDate).getTime();
          valueB = new Date(b.startDate).getTime();
          break;
        case 'totalCases':
          valueA = a.totalCases;
          valueB = b.totalCases;
          break;
        case 'testQuality':
          valueA = a.testQuality;
          valueB = b.testQuality;
          break;
        case 'updatedAt':
        default:
          valueA = new Date(a.updatedAt).getTime();
          valueB = new Date(b.updatedAt).getTime();
      }
      
      // Comparar según dirección
      const compareResult = 
        typeof valueA === 'string' && typeof valueB === 'string'
          ? valueA.localeCompare(valueB)
          : (valueA as number) - (valueB as number);
      
      return sortBy.direction === 'asc' ? compareResult : -compareResult;
    });
    
    return filtered;
  }, [testPlans, selectedProjectId, searchTerm, advancedFiltersOpen, filters, sortBy, favorites, showOnlyFavorites]);
  
  // Efecto separado para resetear la página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectId, searchTerm, advancedFiltersOpen, filters, sortBy, showOnlyFavorites]);

  // Función para manejar la paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para manejar cambios en el filtro de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Función para manejar cambios en los filtros avanzados
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseFloat(value) 
          : value
    }));
  };

  // Función para ordenar los planes
  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Función para alternar favoritos
  const toggleFavorite = (planId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId];
      
      // Guardar en localStorage
      localStorage.setItem('testPlanFavorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  // Calcular planes para la página actual
  const indexOfLastPlan = currentPage * plansPerPage;
  const indexOfFirstPlan = indexOfLastPlan - plansPerPage;
  const currentPlans = filteredPlans.slice(indexOfFirstPlan, indexOfLastPlan);
  const totalPages = Math.ceil(filteredPlans.length / plansPerPage);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
    
    if (e.target.value) {
      const selectedProject = projects.find(p => p.id === e.target.value || p.idJira === e.target.value);
      if (selectedProject) {
        setNewTestPlan(prev => ({
          ...prev,
          projectId: e.target.value,
          projectName: selectedProject.proyecto,
          codeReference: selectedProject.idJira || ''
        }));
      }
    }
  };
  const handleTestPlanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Actualizar el valor en el estado
    setNewTestPlan(prev => {
      const updatedPlan = {
        ...prev,
        [name]: name === 'estimatedHours' || name === 'estimatedDays' || name === 'testQuality' 
          ? parseFloat(value) 
          : value
      };
      
      // Si se actualizan las horas estimadas, calcular automáticamente los días
      if (name === 'estimatedHours') {
        const hours = parseFloat(value) || 0;
        // 1 día = 9 horas de trabajo
        updatedPlan.estimatedDays = hours > 0 ? Math.round((hours / 9) * 10) / 10 : 0;
      }
      
      // Si se actualizan los días estimados, calcular automáticamente las horas
      if (name === 'estimatedDays') {
        const days = parseFloat(value) || 0;
        // 1 día = 9 horas de trabajo
        updatedPlan.estimatedHours = days > 0 ? Math.round(days * 9) : 0;
      }
      
      return updatedPlan;
    });
  };  const handleCreateTestPlan = async () => {
    try {
      // Formatear fechas correctamente
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const formattedDate = `${year}-${month}-${day}`;
      
      // Calcular días estimados si solo se proporcionaron horas
      let { estimatedHours, estimatedDays } = newTestPlan;
      if (estimatedHours && (!estimatedDays || estimatedDays === 0)) {
        estimatedDays = Math.round((estimatedHours / 9) * 10) / 10;
      } else if (estimatedDays && (!estimatedHours || estimatedHours === 0)) {
        estimatedHours = Math.round(estimatedDays * 9);
      }
      
      await createTestPlan({
        ...newTestPlan,
        id: uuidv4(),
        startDate: newTestPlan.startDate || formattedDate,
        estimatedHours,
        estimatedDays,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
      
      // Limpiar estados de búsqueda y cerrar el modal
      setSearchProjectTerm('');
      setIsCreatingPlan(false);
      setNewTestPlan({
        projectId: selectedProjectId,
        projectName: newTestPlan.projectName,
        codeReference: newTestPlan.codeReference,
        startDate: formattedDate,
        endDate: '',
        estimatedHours: 0,
        estimatedDays: 0,
        totalCases: 0,
        cycles: [{ id: uuidv4(), number: 1, designed: 0, successful: 0, notExecuted: 0, defects: 0 }],
        testQuality: 100
      });
      
      toast.success('Plan de pruebas creado correctamente');
    } catch (error) {
      toast.error('Error al crear el plan de pruebas');
    }
  };
  const handleEditPlan = (plan: TestPlan) => {
    setEditingPlan(plan);
    // Usar las fechas directamente sin conversión para evitar problemas de zona horaria
    setNewTestPlan({
      ...plan,
      startDate: plan.startDate,
      endDate: plan.endDate || ''
    });
    setIsEditingPlan(true);
  };
  const handleUpdatePlan = async () => {
    try {
      if (!editingPlan) return;

      const updatedPlan = {
        ...editingPlan,
        ...newTestPlan,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`/api/test-plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el plan de pruebas');
      }

      setIsEditingPlan(false);
      setEditingPlan(null);
      toast.success('Plan de pruebas actualizado correctamente');
      
      // Revalidar la caché de planes
      mutate('/api/test-plans');
      if (selectedProjectId) {
        mutate(`/api/test-plans?projectId=${selectedProjectId}`);
      }
    } catch (error) {
      toast.error('Error al actualizar el plan de pruebas');
    }
  };
    // Preparar la eliminación mostrando el diálogo de confirmación
  const prepareDeletePlan = (plan: TestPlan) => {
    setPlanToDelete(plan);
    setIsDeletingPlan(true);
  };
  
  // Función para eliminar un plan de pruebas
  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      const response = await fetch(`/api/test-plans/${planToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el plan de pruebas');
      }

      toast.success('Plan de pruebas eliminado correctamente');
      
      // Revalidar la caché de planes
      mutate('/api/test-plans');
      if (selectedProjectId) {
        mutate(`/api/test-plans?projectId=${selectedProjectId}`);
      }
      
      // Cerrar el diálogo y limpiar el estado
      setIsDeletingPlan(false);
      setPlanToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar el plan de pruebas');
    }
  };

  return (
    <div className="space-y-4">      
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Planes de Prueba</h2>
        <p className="text-gray-500">Gestiona los planes de prueba del proyecto</p>
      </div>      <div className="mb-4">
        <Label htmlFor="projectSelect">Proyecto</Label>
        <div className="relative">
          <div className="flex space-x-2">
            <Select 
              id="projectSelect"
              value={selectedProjectId} 
              onChange={handleProjectChange}
              className="max-w-md flex-1"
            >
              <option value="">Seleccionar proyecto</option>
              {/* Proyectos urgentes primero (30 días) */}
              {projectsWithPlans.some(p => p.fechaEntrega && (new Date(p.fechaEntrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 30) && (
                <optgroup label="⚠️ Entrega próxima (30 días)">
                  {projectsWithPlans
                    .filter(p => p.fechaEntrega && (new Date(p.fechaEntrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 30)
                    .map((project) => {
                      const planCount = testPlans?.filter(p => p.projectId === project.idJira).length || 0;
                      return (
                        <option key={project.idJira} value={project.idJira}>
                          {project.proyecto} ({planCount} {planCount === 1 ? 'plan' : 'planes'})
                        </option>
                      );
                    })
                  }
                </optgroup>
              )}
              
              {/* Proyectos con fecha de entrega */}
              {projectsWithPlans.some(p => p.fechaEntrega && (new Date(p.fechaEntrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) > 30) && (
                <optgroup label="📅 Con fecha de entrega">
                  {projectsWithPlans
                    .filter(p => p.fechaEntrega && (new Date(p.fechaEntrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) > 30)
                    .map((project) => {
                      const planCount = testPlans?.filter(p => p.projectId === project.idJira).length || 0;
                      return (
                        <option key={project.idJira} value={project.idJira}>
                          {project.proyecto} ({planCount} {planCount === 1 ? 'plan' : 'planes'})
                        </option>
                      );
                    })
                  }
                </optgroup>
              )}
              
              {/* Proyectos sin fecha de entrega */}
              {projectsWithPlans.some(p => !p.fechaEntrega) && (
                <optgroup label="📋 Sin fecha de entrega">
                  {projectsWithPlans
                    .filter(p => !p.fechaEntrega)
                    .map((project) => {
                      const planCount = testPlans?.filter(p => p.projectId === project.idJira).length || 0;
                      return (
                        <option key={project.idJira} value={project.idJira}>
                          {project.proyecto} ({planCount} {planCount === 1 ? 'plan' : 'planes'})
                        </option>
                      );
                    })
                  }
                </optgroup>
              )}
            </Select>
            {selectedProjectId && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setSelectedProjectId('')}
                title="Limpiar selección"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {!isLoading && projectsWithPlans.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            No hay proyectos con planes de prueba. Crea un nuevo plan para comenzar.
          </p>
        )}      
      </div>
        {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 items-start md:items-center bg-gray-50 p-3 rounded-md border">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Buscar planes por referencia o proyecto..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={showOnlyFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className="flex-shrink-0"
          >
            <Star className="mr-1 h-4 w-4" />
            {showOnlyFavorites ? 'Todos los planes' : 'Solo favoritos'}
          </Button>
          
          <Button
            variant={advancedFiltersOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
            className="flex-shrink-0"
          >
            <Filter className="mr-1 h-4 w-4" />
            Filtros avanzados
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setFilters({
                dateFrom: '',
                dateTo: '',
                qualityFrom: 0,
                qualityTo: 100,
                hasCases: false
              });
              setShowOnlyFavorites(false);
            }}
            className="flex-shrink-0"
            disabled={!searchTerm && !advancedFiltersOpen && !showOnlyFavorites}
            title="Limpiar todos los filtros"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </Button>
        </div>
      </div>
      
      {/* Filtros avanzados */}
      {advancedFiltersOpen && (
        <div className="bg-gray-50 p-4 rounded-md border mb-4 grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label htmlFor="dateFrom" className="text-xs font-medium">Fecha desde</Label>
            <Input
              id="dateFrom"
              name="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="h-9"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="dateTo" className="text-xs font-medium">Fecha hasta</Label>
            <Input
              id="dateTo"
              name="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="h-9"
            />
          </div>
          
          <div className="space-y-1 col-span-1 md:col-span-2">
            <div className="flex justify-between">
              <Label htmlFor="qualityRange" className="text-xs font-medium">Calidad</Label>
              <span className="text-xs text-gray-500">{filters.qualityFrom}% - {filters.qualityTo}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Mínimo</span>
                <Input
                  id="qualityFrom"
                  name="qualityFrom"
                  type="range"
                  min="0"
                  max="100"
                  value={filters.qualityFrom}
                  onChange={handleFilterChange}
                  className="h-2"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Máximo</span>
                <Input
                  id="qualityTo"
                  name="qualityTo"
                  type="range"
                  min="0"
                  max="100"
                  value={filters.qualityTo}
                  onChange={handleFilterChange}
                  className="h-2"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="hasCases"
              name="hasCases"
              type="checkbox"
              checked={filters.hasCases}
              onChange={handleFilterChange}
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <Label htmlFor="hasCases" className="text-sm">Solo planes con casos</Label>
          </div>
        </div>
      )}
      
      {/* Resultados y estado de búsqueda */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-500">
          {filteredPlans.length} {filteredPlans.length === 1 ? 'plan encontrado' : 'planes encontrados'}
        </p>
        
        <UpdateQualityButton />
      </div>      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : filteredPlans && filteredPlans.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-gray-50">
                  <TableHead className="cursor-pointer" onClick={() => handleSort('codeReference')}>
                    Referencia {sortBy.field === 'codeReference' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('projectName')}>
                    Proyecto {sortBy.field === 'projectName' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('startDate')}>
                    Fecha {sortBy.field === 'startDate' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer text-center whitespace-nowrap" onClick={() => handleSort('totalCases')}>
                    Casos {sortBy.field === 'totalCases' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer text-center whitespace-nowrap" onClick={() => handleSort('testQuality')}>
                    <div className="flex items-center justify-center gap-1">
                      Calidad
                      <QualityInfoButton />
                      {sortBy.field === 'testQuality' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans
                  .slice((currentPage - 1) * plansPerPage, currentPage * plansPerPage)
                  .map((plan) => (
                  <TableRow key={plan.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleFavorite(plan.id)}
                          className="text-gray-400 hover:text-yellow-500 focus:outline-none"
                          title={favorites.includes(plan.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
                        >
                          {favorites.includes(plan.id) ? 
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> : 
                            <StarOff className="h-4 w-4" />
                          }
                        </button>
                        {plan.codeReference}
                      </div>
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]" title={plan.projectName}>
                      {plan.projectName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        {formatDateWithoutTimezone(plan.startDate)}
                        {plan.endDate && (
                          <div className="text-xs text-gray-500">
                            hasta {formatDateWithoutTimezone(plan.endDate)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{plan.totalCases}</TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${plan.testQuality >= 80 ? 'bg-green-100 text-green-800' : 
                            plan.testQuality >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                            plan.testQuality >= 0 ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {plan.testQuality === -1 ? 'N/A' : `${plan.testQuality}%`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2 py-1 h-8"
                          onClick={() => onPlanSelected(plan.id)}
                          title="Gestionar casos de prueba"
                        >
                          Casos
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditPlan(plan)}
                          title="Editar plan"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-100"
                          onClick={() => prepareDeletePlan(plan)}
                          title="Eliminar plan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 border rounded-md">
          <p className="text-gray-500">No hay planes de prueba disponibles para este proyecto.</p>
        </div>
      )}      {/* Paginación */}
      {filteredPlans.length > plansPerPage && (
        <div className="flex justify-center items-center mt-4">
          <div className="flex items-center gap-1 bg-gray-50 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              title="Primera página"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center mx-2">
              {/* Mostrar páginas numéricas */}
              {Array.from({ length: Math.min(5, Math.ceil(filteredPlans.length / plansPerPage)) }, (_, i) => {
                // Cálculo para mostrar las páginas cercanas a la actual
                let pageToShow;
                const totalPages = Math.ceil(filteredPlans.length / plansPerPage);
                
                if (totalPages <= 5) {
                  // Si hay 5 o menos páginas, mostrar todas
                  pageToShow = i + 1;
                } else if (currentPage <= 3) {
                  // Si estamos en las primeras páginas
                  pageToShow = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  // Si estamos en las últimas páginas
                  pageToShow = totalPages - 4 + i;
                } else {
                  // Si estamos en una página intermedia
                  pageToShow = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageToShow}
                    variant={currentPage === pageToShow ? "default" : "ghost"}
                    size="sm"
                    className={`h-8 w-8 p-0 font-medium ${currentPage === pageToShow ? "" : "text-gray-600"}`}
                    onClick={() => handlePageChange(pageToShow)}
                  >
                    {pageToShow}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === Math.ceil(filteredPlans.length / plansPerPage)}
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(Math.ceil(filteredPlans.length / plansPerPage))}
              disabled={currentPage === Math.ceil(filteredPlans.length / plansPerPage)}
              title="Última página"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isCreatingPlan} onOpenChange={(open) => {
          setIsCreatingPlan(open);
          if (!open) {
            setSearchProjectTerm('');
          }
        }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nuevo Plan de Pruebas</DialogTitle>
          </DialogHeader><div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectSearch">Proyecto</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="projectSearch"
                  placeholder="Buscar por ID o nombre de proyecto..."
                  value={searchProjectTerm || ''}
                  onChange={(e) => setSearchProjectTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {searchProjectTerm && searchProjectTerm.length > 0 && (
                <div className="absolute z-10 mt-1 w-[calc(100%-2rem)] max-h-[300px] overflow-y-auto rounded-md border bg-white shadow-lg">
                  {projects.filter(project => 
                    project.proyecto?.toLowerCase().includes(searchProjectTerm.toLowerCase()) || 
                    project.idJira?.toLowerCase().includes(searchProjectTerm.toLowerCase())
                  ).map((project) => (
                    <div
                      key={project.id || project.idJira}
                      className="cursor-pointer p-3 hover:bg-gray-50 border-b last:border-b-0"
                      onClick={() => {
                        const selectedProject = projects.find(p => p.id === project.id || p.idJira === project.idJira);
                        if (selectedProject) {
                          setSelectedProjectId(project.idJira || '');
                          setSearchProjectTerm('');
                          setNewTestPlan(prev => ({
                            ...prev,
                            projectId: project.idJira || '',
                            projectName: project.proyecto || '',
                            codeReference: project.idJira || ''
                          }));
                        }
                      }}
                    >
                      <div className="font-medium">{project.proyecto}</div>
                      <div className="text-sm text-gray-500">{project.idJira} - {project.equipo || 'Sin equipo'}</div>
                    </div>
                  ))}
                  {projects.filter(project => 
                    project.proyecto?.toLowerCase().includes(searchProjectTerm.toLowerCase()) || 
                    project.idJira?.toLowerCase().includes(searchProjectTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      No se encontraron proyectos
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={newTestPlan.startDate}
                  onChange={handleTestPlanInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin (opcional)</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={newTestPlan.endDate}
                  onChange={handleTestPlanInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                <Input
                  id="estimatedHours"
                  name="estimatedHours"
                  type="number"
                  min="0"
                  value={newTestPlan.estimatedHours}
                  onChange={handleTestPlanInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDays">Días Estimados</Label>
                <Input
                  id="estimatedDays"
                  name="estimatedDays"
                  type="number"
                  min="0"
                  step="0.5"
                  value={newTestPlan.estimatedDays}
                  onChange={handleTestPlanInputChange}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreatingPlan(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateTestPlan}>
              Crear Plan de Pruebas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingPlan} onOpenChange={setIsEditingPlan}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Plan de Pruebas</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <Input
                value={newTestPlan.projectName}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartDate">Fecha de Inicio</Label>
                <Input
                  id="editStartDate"
                  name="startDate"
                  type="date"
                  value={newTestPlan.startDate}
                  onChange={handleTestPlanInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEndDate">Fecha de Fin (opcional)</Label>
                <Input
                  id="editEndDate"
                  name="endDate"
                  type="date"
                  value={newTestPlan.endDate || ''}
                  onChange={handleTestPlanInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editEstimatedHours">Horas Estimadas</Label>
                <Input
                  id="editEstimatedHours"
                  name="estimatedHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={newTestPlan.estimatedHours}
                  onChange={handleTestPlanInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEstimatedDays">Días Estimados</Label>
                <Input
                  id="editEstimatedDays"
                  name="estimatedDays"
                  type="number"
                  min="0"
                  step="0.5"
                  value={newTestPlan.estimatedDays}
                  onChange={handleTestPlanInputChange}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingPlan(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePlan}>
              Guardar Cambios
            </Button>          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar plan */}
      <Dialog open={isDeletingPlan} onOpenChange={setIsDeletingPlan}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar eliminación</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-2">¿Estás seguro de que deseas eliminar el siguiente plan de pruebas?</p>
            {planToDelete && (
              <div className="border rounded-md p-4 bg-gray-50 mb-2">
                <p><strong>Proyecto:</strong> {planToDelete.projectName}</p>
                <p><strong>Referencia:</strong> {planToDelete.codeReference}</p>
                <p><strong>Casos:</strong> {planToDelete.totalCases}</p>
              </div>
            )}
            <p className="text-sm text-red-600">Esta acción eliminará permanentemente el plan de pruebas y no se puede deshacer.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeletingPlan(false);
              setPlanToDelete(null);
            }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan}>
              Eliminar Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
