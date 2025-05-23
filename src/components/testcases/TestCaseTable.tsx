'use client';

import { useState, useEffect } from 'react';
import { useTestCases, deleteTestCase, useTestPlans } from '@/hooks/useTestCases';
import { TestCase, TestPlan } from '@/models/TestCase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import TestCaseForm from './TestCaseForm';
import TestCaseDetailsDialog from './TestCaseDetailsDialog';
import TestCaseStatusChanger from './TestCaseStatusChanger';
import BulkAssignmentDialog from './BulkAssignmentDialog';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/useProjects';

interface TestCaseTableProps {
  projectId?: string;
  testPlanId?: string;
}

export default function TestCaseTable({ projectId, testPlanId }: TestCaseTableProps) {
  const { testCases, isLoading, isError } = useTestCases(projectId);
  const { testPlans, isLoading: isLoadingPlans } = useTestPlans(projectId);
  const { projects } = useProjects();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    testType: '',
    userStory: '',
    testPlanId: testPlanId || ''
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<string[]>([]);
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false);
  // Recopilar todas las historias de usuario únicas
  const uniqueUserStories = [...new Set(testCases?.map(tc => tc.userStoryId) || [])].filter(Boolean);

  // Filtrar casos de prueba según los filtros
  const filteredTestCases = testCases.filter((tc) => {
    // Filtro por plan de pruebas
    const planMatch = !filters.testPlanId || tc.testPlanId === filters.testPlanId;
    
    // Filtro de búsqueda por texto (nombre o descripción)
    const searchMatch = 
      filters.search === '' || 
      tc.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      tc.expectedResult?.toLowerCase().includes(filters.search.toLowerCase());
    
    // Filtro por estado
    const statusMatch = filters.status === '' || tc.status === filters.status;
    
    // Filtro por tipo de prueba
    const typeMatch = filters.testType === '' || tc.testType === filters.testType;
    
    // Filtro por historia de usuario
    const userStoryMatch = filters.userStory === '' || tc.userStoryId === filters.userStory;
    
    return planMatch && searchMatch && statusMatch && typeMatch && userStoryMatch;
  });

  // Manejo de edición y eliminación
  const handleEdit = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este caso de prueba?')) {
      try {
        await deleteTestCase(id, projectId);
        toast.success('Caso de prueba eliminado correctamente');
      } catch (error) {
        toast.error('Error al eliminar el caso de prueba');
      }
    }
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Casos de Prueba</h2>
          <p className="text-gray-500">{projectName}</p>
          {casesWithoutResponsible > 0 && (
            <p className="text-amber-600 text-sm mt-1">
              {casesWithoutResponsible} caso(s) sin persona responsable asignada
            </p>
          )}
        </div>
        
        <div className="flex space-x-2">
          {isLoadingPlans ? (
            <Button disabled>
              Cargando planes...
            </Button>
          ) : testPlans?.length > 0 ? (
            <Button 
              onClick={() => {
                setEditingTestCase(null);
                setIsFormOpen(true);
              }}
            >
              Nuevo Caso de Prueba
            </Button>
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
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Select
          value={filters.testPlanId}
          onChange={e => setFilters(prev => ({ ...prev, testPlanId: e.target.value }))}
        >
          <option value="">Todos los planes</option>
          {testPlans?.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.codeReference} - {plan.projectName}
            </option>
          ))}
        </Select>

        <Input
          placeholder="Buscar..."
          value={filters.search}
          onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
        
        <Select
          value={filters.status}
          onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="">Todos los estados</option>
          <option value="No ejecutado">No ejecutado</option>
          <option value="Exitoso">Exitoso</option>
          <option value="Fallido">Fallido</option>
          <option value="Bloqueado">Bloqueado</option>
          <option value="En progreso">En progreso</option>
        </Select>

        <Select
          value={filters.testType}
          onChange={e => setFilters(prev => ({ ...prev, testType: e.target.value }))}
        >
          <option value="">Todos los tipos</option>
          <option value="Funcional">Funcional</option>
          <option value="No Funcional">No Funcional</option>
          <option value="Regresión">Regresión</option>
          <option value="Exploratoria">Exploratoria</option>
          <option value="Integración">Integración</option>
          <option value="Rendimiento">Rendimiento</option>
          <option value="Seguridad">Seguridad</option>
        </Select>
        
        {selectedTestCaseIds.length > 0 && (
          <Button
            onClick={() => setIsBulkAssignDialogOpen(true)}
          >
            Asignar {selectedTestCaseIds.length} caso(s)
          </Button>
        )}
      </div>

      {/* Selector de HU */}
      <div>
        <Select
          value={filters.userStory}
          onChange={e => setFilters(prev => ({ ...prev, userStory: e.target.value }))}
        >
          <option value="">Todas las historias de usuario</option>
          {uniqueUserStories.map((userStory) => (
            <option key={userStory} value={userStory}>
              {userStory}
            </option>
          ))}
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
        
        <div>
          <Button 
            variant="outline"
            onClick={() => setIsBulkAssignDialogOpen(true)}
          >
            Asignación masiva
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          Error al cargar los casos de prueba. Intente nuevamente.
        </div>
      ) : filteredTestCases.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <p className="text-gray-500">No hay casos de prueba que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-auto max-h-[65vh]">
          <Table>            <TableHeader className="sticky top-0 bg-white">
              <TableRow>
                <TableHead>
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedTestCaseIds.length === filteredTestCases.length}                      onCheckedChange={(checked: boolean) => {
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
                      checked={selectedTestCaseIds.includes(testCase.id)}                      onCheckedChange={(checked: boolean) => {
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
                  <TableCell className="text-right space-x-2" onClick={e => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(testCase)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(testCase.id)}>
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
      )}      {/* Diálogo de asignación masiva */}
      {isBulkAssignDialogOpen && (
        <BulkAssignmentDialog
          isOpen={isBulkAssignDialogOpen}
          onClose={() => setIsBulkAssignDialogOpen(false)}
          selectedTestCaseIds={selectedTestCaseIds}
          projectId={projectId}
        />
      )}
    </div>
  );
}
