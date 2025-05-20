'use client';

import { useState, useEffect } from 'react';
import { useTestCases, deleteTestCase } from '@/hooks/useTestCases';
import { TestCase } from '@/models/TestCase';
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
import TestCaseForm from './TestCaseForm';
import TestCaseDetailsDialog from './TestCaseDetailsDialog';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/useProjects';

interface TestCaseTableProps {
  projectId?: string;
}

export default function TestCaseTable({ projectId }: TestCaseTableProps) {
  const { testCases, isLoading, isError } = useTestCases(projectId);
  const { projects } = useProjects();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    testType: '',
    userStory: ''
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);

  // Recopilar todas las historias de usuario únicas
  const uniqueUserStories = [...new Set(testCases?.map(tc => tc.userStoryId) || [])].filter(Boolean);

  // Filtrar casos de prueba según los filtros
  const filteredTestCases = testCases.filter((tc) => {
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
    
    return searchMatch && statusMatch && typeMatch && userStoryMatch;
  });

  // Manejo de edición
  const handleEdit = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setIsFormOpen(true);
  };
  
  // Manejo de eliminación
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
  
  // Ver detalles
  const handleViewDetails = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setIsDetailsDialogOpen(true);
  };
  
  // Encontrar el nombre del proyecto si existe
  const projectName = projectId && projects ? 
    projects.find(p => p.id === projectId || p.idJira === projectId)?.proyecto || 'Proyecto no encontrado' :
    'Todos los proyectos';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Casos de Prueba</h2>
          <p className="text-gray-500">{projectName}</p>
        </div>
        
        <Button onClick={() => {
          setEditingTestCase(null);
          setIsFormOpen(true);
        }}>
          Nuevo Caso de Prueba
        </Button>
      </div>
      
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        
        <Select
          value={filters.userStory}
          onChange={e => setFilters(prev => ({ ...prev, userStory: e.target.value }))}
        >
          <option value="">Todas las HU</option>
          {uniqueUserStories.map(hu => (
            <option key={hu} value={hu}>{hu}</option>
          ))}
        </Select>
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
          <Table>
            <TableHeader className="sticky top-0 bg-white">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>HU</TableHead>
                <TableHead>Nombre del Caso</TableHead>
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
                <TableRow 
                  key={testCase.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleViewDetails(testCase)}
                >
                  <TableCell className="font-medium">{testCase.codeRef}</TableCell>
                  <TableCell>{testCase.userStoryId}</TableCell>
                  <TableCell>{testCase.name}</TableCell>
                  <TableCell>{testCase.testType}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      testCase.status === 'Exitoso' ? 'bg-green-100 text-green-800' :
                      testCase.status === 'Fallido' ? 'bg-red-100 text-red-800' :
                      testCase.status === 'Bloqueado' ? 'bg-orange-100 text-orange-800' :
                      testCase.status === 'En progreso' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {testCase.status}
                    </span>
                  </TableCell>
                  <TableCell>{testCase.cycle}</TableCell>
                  <TableCell>{testCase.defects?.length || 0}</TableCell>
                  <TableCell>{testCase.responsiblePerson || '-'}</TableCell>
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
      )}
    </div>
  );
}
