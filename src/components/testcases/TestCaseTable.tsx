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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-radix';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import TestCaseForm from './TestCaseForm';
import TestCaseDetailsDialog from './TestCaseDetailsDialog';
import TestCaseStatusChanger from './TestCaseStatusChanger';
import BulkAssignmentDialog from './BulkAssignmentDialog';
import ExcelTestCaseImportExport from './ExcelTestCaseImportExport';
import { useTestCases, useTestPlans, deleteTestCase } from '@/hooks/useTestCases';
import { useProjects } from '@/hooks/useProjects';
import { TestCase } from '@/models/TestCase';
import SelectTestPlan from './SelectTestPlan';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface TestCaseTableProps {
  projectId?: string;
  testPlanId?: string;
}

export default function TestCaseTable({ projectId, testPlanId }: TestCaseTableProps) {
  const { testCases, isLoading, isError, refreshData } = useTestCases(projectId);
  const { testPlans, isLoading: isLoadingPlans } = useTestPlans(projectId);
  const { projects } = useProjects();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    testType: '',
    userStory: 'all_stories', // Usar valor no vacío
    testPlanId: testPlanId || ''
  });
    // Este efecto debe declararse después de la inicialización de filteredTestCases
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<string[]>([]);
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  
  // Efecto para limpiar el filtro de historia de usuario cuando cambia el plan de prueba
  useEffect(() => {
    // Reiniciar el filtro de historia de usuario al cambiar de plan
    setFilters(prev => ({ ...prev, userStory: 'all_stories' }));
  }, [filters.testPlanId]);
    // Filtrar casos de prueba primero por el plan seleccionado
  const testCasesBySelectedPlan = useMemo(() => {
    return testCases.filter(tc => !filters.testPlanId || tc.testPlanId === filters.testPlanId);
  }, [testCases, filters.testPlanId]);
  
  // Recopilar las historias de usuario únicas según el plan seleccionado
  const uniqueUserStories = useMemo(() => {
    return [...new Set(testCasesBySelectedPlan.map(tc => tc.userStoryId).filter(Boolean))].sort();
  }, [testCasesBySelectedPlan]);
  // Filtrar casos de prueba según los filtros
  const filteredTestCases = useMemo(() => {
    // Verificamos si los casos de prueba están vacíos pero no en carga
    if (testCases.length === 0 && !isLoading) {
      console.log('No hay casos de prueba cargados para filtrar');
    }
    
    return testCases.filter((tc) => {
      // Filtro por plan de pruebas
      const planMatch = !filters.testPlanId || tc.testPlanId === filters.testPlanId;
      
      // Filtro de búsqueda por texto (nombre o descripción)
      const searchMatch = 
        filters.search === '' || 
        tc.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        tc.expectedResult?.toLowerCase().includes(filters.search.toLowerCase());
      // Filtro por estado (corregido para manejar el caso cuando no hay estado seleccionado)
      const statusMatch = !filters.status || filters.status === 'all_status' || tc.status === filters.status;
      
      // Filtro por tipo de prueba (corregido para manejar el caso cuando no hay tipo seleccionado)
      const typeMatch = !filters.testType || filters.testType === 'all_types' || tc.testType === filters.testType;
        // Filtro por historia de usuario
      const userStoryMatch = 
        !filters.userStory || 
        filters.userStory === 'all_stories' || 
        filters.userStory === 'no_stories' || 
        filters.userStory === 'no_plan' || 
        tc.userStoryId === filters.userStory;
      
      return planMatch && searchMatch && statusMatch && typeMatch && userStoryMatch;
    });
  }, [testCases, filters, isLoading]);
  // Efecto para reiniciar filtros cuando cambian los casos de prueba
  useEffect(() => {
    if (testCases.length > 0 && filteredTestCases.length === 0) {
      // Si hay casos pero ninguno se muestra, resetear los filtros
      console.log('Reiniciando filtros porque hay casos pero ninguno se está mostrando');      setFilters({
        search: '',
        status: '',
        testType: '',
        userStory: 'all_stories', // Usar valor no vacío
        testPlanId: ''
      });
    }
  }, [testCases, filteredTestCases]);
  
  // Refrescar automáticamente los datos al montar el componente
  useEffect(() => {
    console.log("Componente TestCaseTable montado. Actualizando datos...");
    refreshData();
    
    // Refrescar cada 30 segundos para asegurarnos de tener datos actualizados
    const refreshInterval = setInterval(() => {
      console.log("Actualizando datos periódicamente...");
      refreshData();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [refreshData]);

  // Manejo de edición y eliminación
  const handleEdit = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setIsFormOpen(true);
  };

  // Variables para dialogo de confirmación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // Eliminación masiva de casos de prueba
  const handleBulkDelete = () => {
    // Verificar que haya casos seleccionados
    if (selectedTestCaseIds.length === 0) {
      toast.error('No hay casos seleccionados para eliminar');
      return;
    }

    // Verificar que todos los casos tengan el mismo estado
    const selectedCases = filteredTestCases.filter(tc => selectedTestCaseIds.includes(tc.id));
    const firstStatus = selectedCases[0]?.status;
    const allSameStatus = selectedCases.every(tc => tc.status === firstStatus);
    
    if (!allSameStatus) {
      setBulkDeleteError('No se pueden eliminar casos que tienen estados diferentes. Todos deben tener el mismo estado.');
      setIsDeleteDialogOpen(true);
      setIsBulkDelete(true);
      return;
    }

    // Preparar la eliminación masiva
    setIsBulkDelete(true);
    setBulkDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  // Confirmar eliminación de casos
  const confirmDelete = async () => {
    try {
      if (isBulkDelete && selectedTestCaseIds.length > 0) {
        // Eliminar varios casos
        const results = await Promise.allSettled(
          selectedTestCaseIds.map(id => deleteTestCase(id, projectId))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        if (failed === 0) {
          toast.success(`${successful} casos de prueba eliminados correctamente`);
        } else {
          toast.warning(`${successful} casos eliminados, pero ${failed} casos no se pudieron eliminar`);
        }
        
        // Limpiar selección
        setSelectedTestCaseIds([]);
      } else if (deletingId) {
        // Eliminar un solo caso
        await deleteTestCase(deletingId, projectId);
        toast.success('Caso de prueba eliminado correctamente');
      }
      
      // Refrescar datos y cerrar diálogo
      refreshData();
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      setIsBulkDelete(false);
      setBulkDeleteError(null);
    } catch (error) {
      toast.error('Error al eliminar el caso de prueba');
    }
  };

  const handleDelete = async (id: string) => {
    // Usar el nuevo diálogo de confirmación en lugar de window.confirm
    setDeletingId(id);
    setIsBulkDelete(false);
    setBulkDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setIsDetailsDialogOpen(true);
  };

  const handleBulkAssign = () => {
    setIsBulkAssignDialogOpen(true);
  };
  // Encontrar el nombre del proyecto si existe
  const projectName = projectId && projects ? 
    projects.find(p => p.id === projectId || p.idJira === projectId)?.proyecto || 'Proyecto no encontrado' :
    'Todos los proyectos';
    
  // Calcular cuántos casos no tienen persona responsable asignada
  const casesWithoutResponsible = testCases.filter(tc => !tc.responsiblePerson || tc.responsiblePerson === '-').length;

  return (
    <div className="space-y-4">      <div className="flex justify-between items-center">
        <div className="flex items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold">Casos de Prueba</h2>
            <p className="text-gray-500">{projectName}</p>
            {casesWithoutResponsible > 0 && (
              <p className="text-amber-600 text-sm mt-1">
                {casesWithoutResponsible} caso(s) sin persona responsable asignada
              </p>
            )}
          </div>
          
          <button
            onClick={() => {
              refreshData();
              toast.success('Actualizando casos de prueba...');
            }}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded px-3 py-1 mt-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
            </svg>
            Actualizar
          </button>
        </div>
        
        <div className="flex space-x-2">
          {isLoadingPlans ? (
            <Button disabled>
              Cargando planes...
            </Button>
          ) : testPlans?.length > 0 ? (
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setEditingTestCase(null);
                  setIsFormOpen(true);
                }}
              >
                Nuevo Caso de Prueba
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setIsAIDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Sparkles size={16} /> Generar con IA
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline"
              disabled
              title="Debe crear un plan de pruebas primero"
            >
              Necesita un plan de pruebas
            </Button>
          )}
        </div>
      </div>      {/* Filtros */}      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative z-30">
          <SelectTestPlan
            testPlans={testPlans || []}
            selectedPlanId={filters.testPlanId}
            onSelectPlan={(planId) => setFilters(prev => ({ ...prev, testPlanId: planId }))}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="search-input" className="text-sm font-medium">Búsqueda</label>
          <Input
            id="search-input"
            placeholder="Buscar por nombre..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
          <div className="space-y-2">
          <label htmlFor="status-select" className="text-sm font-medium">Estado</label>
          <Select value={filters.status} onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger id="status-select">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>              <SelectItem value="all_status">Todos los estados</SelectItem>
              <SelectItem value="No ejecutado">No ejecutado</SelectItem>
              <SelectItem value="Exitoso">Exitoso</SelectItem>
              <SelectItem value="Fallido">Fallido</SelectItem>
              <SelectItem value="Bloqueado">Bloqueado</SelectItem>
              <SelectItem value="En progreso">En progreso</SelectItem>
            </SelectContent>
          </Select>
        </div><div className="space-y-2">          <label htmlFor="type-select" className="text-sm font-medium">Tipo de prueba</label>
          <Select value={filters.testType} onValueChange={value => setFilters(prev => ({ ...prev, testType: value }))}>
            <SelectTrigger id="type-select">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>              <SelectItem value="all_types">Todos los tipos</SelectItem>
              <SelectItem value="Funcional">Funcional</SelectItem>
              <SelectItem value="No Funcional">No Funcional</SelectItem>
              <SelectItem value="Regresión">Regresión</SelectItem>
              <SelectItem value="Exploratoria">Exploratoria</SelectItem>
              <SelectItem value="Integración">Integración</SelectItem>
              <SelectItem value="Rendimiento">Rendimiento</SelectItem>
              <SelectItem value="Seguridad">Seguridad</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          {selectedTestCaseIds.length > 0 && (
            <Button
              onClick={() => setIsBulkAssignDialogOpen(true)}
            >
              Asignar {selectedTestCaseIds.length} caso(s)
            </Button>
          )}
        </div>      </div>
      
      {/* Selector de HU */}
      <div className="mt-4 pt-4 border-t border-blue-100">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="hu-select" className="text-sm font-semibold text-blue-700">
            Filtrar por Historia de Usuario
          </label>
          {filters.testPlanId && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              {uniqueUserStories.length} {uniqueUserStories.length === 1 ? 'historia' : 'historias'} disponibles
            </span>
          )}
        </div>        <Select
          value={filters.userStory}
          onValueChange={(value) => setFilters(prev => ({ ...prev, userStory: value }))}
          disabled={!filters.testPlanId || uniqueUserStories.length === 0}
        >
          <SelectTrigger className={!filters.testPlanId ? "bg-gray-50 text-gray-400" : "border-blue-200 focus:border-blue-400"}>
            <SelectValue placeholder={
              !filters.testPlanId 
              ? "Seleccione un plan primero" 
              : uniqueUserStories.length === 0 
                ? "No hay historias en este plan" 
                : "Seleccionar historia"
            } />
          </SelectTrigger>          <SelectContent>
            {!filters.testPlanId ? (
              <SelectItem value="no_plan">Seleccione un plan primero</SelectItem>
            ) : uniqueUserStories.length === 0 ? (
              <SelectItem value="no_stories">No hay historias en este plan</SelectItem>
            ) : (
              <>
                <SelectItem value="all_stories">Todas las historias de usuario</SelectItem>
                {uniqueUserStories.map((userStory) => (
                  <SelectItem key={userStory} value={userStory}>
                    {userStory}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Acciones de selección masiva */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allIds = filteredTestCases.map(tc => tc.id);
              setSelectedTestCaseIds(allIds);
            }}
          >
            Seleccionar todo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedTestCaseIds([])}
          >
            Deseleccionar todo
          </Button>
          
          {selectedTestCaseIds.length > 0 && (
            <span className="text-sm text-gray-500">
              {selectedTestCaseIds.length} caso(s) seleccionado(s)
            </span>
          )}
        </div>
          <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsBulkAssignDialogOpen(true)}
          >
            Asignación masiva
          </Button>
          
          {selectedTestCaseIds.length > 0 && (
            <Button 
              variant="destructive"
              onClick={handleBulkDelete}
            >
              Eliminar seleccionados
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          Error al cargar los casos de prueba. Intente nuevamente.
        </div>      ) : filteredTestCases.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <p className="text-gray-500">No hay casos de prueba que coincidan con los filtros.</p>
          {testCases.length > 0 && (
            <div className="mt-4 text-left p-4 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-700">Información de diagnóstico:</p>
              <ul className="text-xs text-blue-600 mt-2 space-y-1">
                <li>Total de casos en base de datos: {testCases.length}</li>
                <li>Filtro de plan actual: {filters.testPlanId || 'Ninguno'}</li>
                <li>Filtro de estado: {filters.status || 'Ninguno'}</li>
                <li>Filtro de tipo: {filters.testType || 'Ninguno'}</li>
                <li>Filtro de HU: {filters.userStory || 'Ninguno'}</li>
                <li>Búsqueda: {filters.search || 'Ninguna'}</li>
              </ul>
              <button 
                className="mt-3 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded"
                onClick={() => setFilters({
                  search: '',
                  status: '',
                  testType: '',
                  userStory: '',
                  testPlanId: ''
                })}
              >
                Resetear todos los filtros
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-md overflow-auto max-h-[65vh]">
          <Table>
            <TableHeader className="sticky top-0 bg-white">
              <TableRow>
                <TableHead>
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedTestCaseIds.length === filteredTestCases.length}
                      onCheckedChange={(checked: boolean) => {
                        setSelectedTestCaseIds(checked ? filteredTestCases.map(tc => tc.id) : []);
                      }}
                    />
                  </div>
                </TableHead>
                <TableHead>Código</TableHead>
                <TableHead>HU</TableHead>
                <TableHead>Nombre del Caso</TableHead>
                <TableHead>Plan Pruebas</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Defectos</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTestCases.map((testCase) => (
                <TableRow key={testCase.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewDetails(testCase)}>
                  <TableCell className="font-medium">
                    <Checkbox
                      checked={selectedTestCaseIds.includes(testCase.id)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedTestCaseIds(prev => [...prev, testCase.id]);
                        } else {
                          setSelectedTestCaseIds(prev => prev.filter(id => id !== testCase.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{testCase.codeRef}</TableCell>
                  <TableCell>{testCase.userStoryId}</TableCell>
                  <TableCell>{testCase.name}</TableCell>
                  <TableCell>
                    {testCase.testPlanId && (
                      <Badge variant="secondary">
                        {testPlans?.find(plan => plan.id === testCase.testPlanId)?.codeReference || 'Plan ' + testCase.testPlanId.slice(0, 6)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{testCase.testType}</TableCell>                  <TableCell onClick={e => e.stopPropagation()}>
                    <TestCaseStatusChanger testCase={testCase} />
                  </TableCell>
                  <TableCell>{testCase.cycle}</TableCell>
                  <TableCell>{testCase.defects?.length || 0}</TableCell>
                  <TableCell>
                    {testCase.responsiblePerson && testCase.responsiblePerson !== '-' ? (
                      testCase.responsiblePerson
                    ) : (
                      <span className="text-amber-600 font-medium">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2" onClick={e => e.stopPropagation()}>                    <Button variant="outline" size="sm" onClick={() => handleEdit(testCase)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation(); // Evitar que se dispare la acción de detalles
                      handleDelete(testCase.id);
                    }}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
        {isFormOpen && (
        <TestCaseForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTestCase(null);
          }}
          testCase={editingTestCase}
          projectId={projectId}
          testPlanId={testPlanId}
        />
      )}
      
      {selectedTestCase && (
        <TestCaseDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => {
            setIsDetailsDialogOpen(false);
            setSelectedTestCase(null);
          }}
          testCase={selectedTestCase}
        />
      )}      {/* Diálogo de asignación masiva */}      {isBulkAssignDialogOpen && (
        <BulkAssignmentDialog
          isOpen={isBulkAssignDialogOpen}
          onClose={() => setIsBulkAssignDialogOpen(false)}
          selectedTestCaseIds={selectedTestCaseIds}
          projectId={projectId}
        />
      )}

      {/* Diálogo de confirmación para eliminar casos de prueba */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isBulkDelete 
                ? bulkDeleteError 
                  ? 'No se puede eliminar' 
                  : `Eliminar ${selectedTestCaseIds.length} casos de prueba`
                : 'Eliminar caso de prueba'
              }
            </DialogTitle>
            <DialogDescription>
              {bulkDeleteError ? (
                <div className="text-red-600 mt-2">
                  {bulkDeleteError}
                </div>
              ) : (
                <>
                  {isBulkDelete ? (
                    <span>
                      ¿Estás seguro de que deseas eliminar los {selectedTestCaseIds.length} casos de prueba seleccionados? 
                      Esta acción no se puede deshacer.
                    </span>
                  ) : (
                    <span>
                      ¿Estás seguro de que deseas eliminar este caso de prueba? 
                      Esta acción no se puede deshacer.
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingId(null);
              setBulkDeleteError(null);
            }}>
              Cancelar
            </Button>
            
            {!bulkDeleteError && (
              <Button variant="destructive" onClick={confirmDelete}>
                Eliminar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
        
      {/* Al hacer clic en el botón "Generar con IA", abrimos el diálogo y activamos el modo de IA */}
      {isAIDialogOpen && (
        <Dialog
          open={isAIDialogOpen}
          onOpenChange={(isOpen) => {
            setIsAIDialogOpen(isOpen);
          }}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generar Casos de Prueba con IA</DialogTitle>
              <DialogDescription>
                Importa requisitos desde Excel y genéralos automáticamente con IA
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              {/* 
                Renderizamos el componente ExcelTestCaseImportExport, 
                pero no mostramos sus botones propios ya que los manejamos en este diálogo 
              */}
              <ExcelTestCaseImportExport 
                projectId={projectId}
                testPlanId={testPlanId}
                initialMode="ai"
                onRefresh={() => {
                  // Cerrar el diálogo después de importar
                  setIsAIDialogOpen(false);
                }}
              />
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
