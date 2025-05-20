'use client';

import { useState, useEffect, useRef } from 'react';
import TestCaseTable from '@/components/testcases/TestCaseTable';
import TestCaseStats from '@/components/testcases/TestCaseStats';
import TestCaseDefectTracker from '@/components/testcases/TestCaseDefectTracker';
import TestCasePlanManager from '@/components/testcases/TestCasePlanManager';
import ExcelTestCaseImportExport from '@/components/testcases/ExcelTestCaseImportExport';
import { useProjects } from '@/hooks/useProjects';
import { useTestCases, useTestPlans, createTestPlan } from '@/hooks/useTestCases';
import { Select } from '@/components/ui/select';
import { TestPlan } from '@/models/TestCase';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';

export default function TestCasesPage() {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTestPlanId, setSelectedTestPlanId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('plans');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');
  const [projectSearchInDialog, setProjectSearchInDialog] = useState<string>('');
  const [showProjectDropdown, setShowProjectDropdown] = useState<boolean>(false);
  const { testCases } = useTestCases(selectedProjectId);
  const { testPlans } = useTestPlans(selectedProjectId);
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

  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredProjects = projects.filter((project) => {
    const searchTermLower = projectSearchTerm.toLowerCase();
    return (
      project.proyecto?.toLowerCase().includes(searchTermLower) || 
      project.idJira?.toLowerCase().includes(searchTermLower)
    );
  });

  const getActiveProjects = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return projects.filter(project => {
      const entregaDate = project.fechaEntrega ? new Date(project.fechaEntrega) : null;
      const isActive = entregaDate ? entregaDate >= today : false;
      
      const searchLower = projectSearchInDialog.toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
        project.proyecto?.toLowerCase().includes(searchLower) ||
        project.idJira?.toLowerCase().includes(searchLower) ||
        project.equipo?.toLowerCase().includes(searchLower);
      
      return isActive && matchesSearch;
    }).sort((a, b) => {
      const dateA = a.fechaEntrega ? new Date(a.fechaEntrega) : new Date(9999, 11, 31);
      const dateB = b.fechaEntrega ? new Date(b.fechaEntrega) : new Date(9999, 11, 31);
      return dateA.getTime() - dateB.getTime();
    });
  };

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
    setNewTestPlan(prev => ({
      ...prev,
      [name]: name === 'estimatedHours' || name === 'estimatedDays' || name === 'testQuality' 
        ? parseFloat(value) 
        : value
    }));
  };
  
  const handleCreateTestPlan = async () => {
    try {
      await createTestPlan({
        ...newTestPlan,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      setIsCreatingPlan(false);
      setNewTestPlan({
        projectId: selectedProjectId,
        projectName: newTestPlan.projectName,
        codeReference: newTestPlan.codeReference,
        startDate: new Date().toISOString().split('T')[0],
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

  const selectProject = (project: any) => {
    setSelectedProjectId(project.idJira || '');
    setProjectSearchTerm(project.proyecto || '');
    setShowProjectDropdown(false);
    
    if (project) {
      setNewTestPlan(prev => ({
        ...prev,
        projectId: project.idJira || '',
        projectName: project.proyecto || '',
        codeReference: project.idJira || ''
      }));
    }
    
    setSelectedTestPlanId('');
  };

  const clearProjectSelection = () => {
    setSelectedProjectId('');
    setSelectedTestPlanId('');
    setProjectSearchTerm('');
  };

  const clearSearchInDialog = () => {
    setProjectSearchInDialog('');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Sistema de Gestión de Casos de Prueba</h1>
          <p className="text-gray-600">Crea y gestiona tus casos de prueba y planes de calidad</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Buscar/Seleccionar Proyecto</label>
            <div className="relative">
              <div className="flex">
                <Input
                  type="text"
                  placeholder="Buscar por nombre o código Jira..."
                  value={projectSearchTerm}
                  onChange={(e) => {
                    setProjectSearchTerm(e.target.value);
                    setShowProjectDropdown(true);
                  }}
                  onClick={() => setShowProjectDropdown(true)}
                  className="flex-grow"
                />
                {selectedProjectId && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2" 
                    onClick={clearProjectSelection}
                    title="Limpiar selección"
                  >
                    <span>×</span>
                  </Button>
                )}
              </div>
              
              {showProjectDropdown && (
                <div ref={dropdownRef} className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border max-h-60 overflow-auto">
                  <div className="p-2 border-b text-sm text-gray-500">
                    {filteredProjects.length > 0 
                      ? `${filteredProjects.length} proyecto(s) encontrado(s)` 
                      : 'No se encontraron proyectos'}
                  </div>
                  
                  <ul>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => {
                      clearProjectSelection();
                      setShowProjectDropdown(false);
                    }}>
                      <div className="font-medium">Todos los proyectos</div>
                    </li>
                    {filteredProjects.map((project) => (
                      <li 
                        key={project.id || project.idJira} 
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectProject(project)}
                      >
                        <div className="font-medium">{project.proyecto}</div>
                        {project.idJira && <div className="text-xs text-gray-500">ID Jira: {project.idJira}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Plan de Pruebas</label>
            <Select
              value={selectedTestPlanId}
              onChange={(e) => setSelectedTestPlanId(e.target.value)}
              disabled={!selectedProjectId || testPlans.length === 0}
            >
              <option value="">Todos los planes</option>
              {testPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.codeReference} - Ciclo {Math.max(...plan.cycles.map(c => c.number))}
                </option>
              ))}
            </Select>
            {selectedProjectId && testPlans.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No hay planes de prueba para este proyecto</p>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="plans">Planes de Prueba</TabsTrigger>
            <TabsTrigger value="cases">Casos de Prueba</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            <TabsTrigger value="defects">Defectos</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <ExcelTestCaseImportExport projectId={selectedProjectId} />
            {activeTab !== 'cases' && (
              <Button onClick={() => setIsCreatingPlan(true)}>
                Nuevo Plan de Pruebas
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="plans">
          <TestCasePlanManager
            onPlanSelected={(planId) => {
              setSelectedTestPlanId(planId);
              setSelectedProjectId(testPlans.find(p => p.id === planId)?.projectId || '');
              setActiveTab('cases');
            }}
          />
        </TabsContent>

        <TabsContent value="cases" className="mt-6">
          <div className="mb-4">
            {selectedTestPlanId ? (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p className="text-sm text-blue-700">
                  Plan de pruebas seleccionado: {testPlans.find(p => p.id === selectedTestPlanId)?.codeReference || 'No encontrado'}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <p className="text-sm text-yellow-700">
                  Selecciona un plan de pruebas en la pestaña "Planes de Prueba" para comenzar a crear casos de prueba
                </p>
              </div>
            )}
          </div>
          <TestCaseTable 
            projectId={selectedProjectId}
            testPlanId={selectedTestPlanId} 
          />
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <TestCaseStats 
            projectId={selectedProjectId}
            testPlanId={selectedTestPlanId}
          />
        </TabsContent>
        
        <TabsContent value="defects" className="mt-6">
          <TestCaseDefectTracker 
            projectId={selectedProjectId}
            testPlanId={selectedTestPlanId}
          />
        </TabsContent>
      </Tabs>
      
      {isCreatingPlan && (
        <Dialog open={isCreatingPlan} onOpenChange={setIsCreatingPlan}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader className="pb-2">
              <DialogTitle>Nuevo Plan de Pruebas</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Proyecto</Label>
                <div className="mt-1.5">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar por nombre, ID o equipo..."
                      value={projectSearchInDialog}
                      onChange={(e) => setProjectSearchInDialog(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <div className="mt-1 max-h-[180px] overflow-y-auto rounded-md border bg-white shadow-sm">
                    <div className="p-2 text-sm text-gray-500">
                      Proyectos Activos
                      <span className="float-right text-blue-600">{getActiveProjects().length} proyectos disponibles</span>
                    </div>
                    {getActiveProjects().map((project) => (
                      <div
                        key={project.id || project.idJira}
                        className="cursor-pointer border-t p-2 hover:bg-gray-50"
                        onClick={() => {
                          setSelectedProjectId(project.idJira || '');
                          setProjectSearchInDialog('');
                          setNewTestPlan(prev => ({
                            ...prev,
                            projectId: project.idJira,
                            projectName: project.proyecto || '',
                            codeReference: project.idJira || ''
                          }));
                        }}
                      >
                        <div className="font-medium">{project.proyecto}</div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>ID: {project.idJira}</span>
                          {project.equipo && <span>Equipo: {project.equipo}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Código de Referencia</Label>
                <Input
                  value={newTestPlan.codeReference || ''}
                  onChange={(e) => setNewTestPlan(prev => ({ ...prev, codeReference: e.target.value }))
                  }
                  className="mt-1.5"
                  placeholder="SRCA-XXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha Inicio</Label>
                  <Input
                    type="date"
                    name="startDate"
                    value={newTestPlan.startDate}
                    onChange={handleTestPlanInputChange}
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    name="endDate"
                    value={newTestPlan.endDate}
                    onChange={handleTestPlanInputChange}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horas Est.</Label>
                  <Input
                    type="number"
                    name="estimatedHours"
                    min="0"
                    value={newTestPlan.estimatedHours}
                    onChange={handleTestPlanInputChange}
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label>Días Est.</Label>
                  <Input
                    type="number"
                    name="estimatedDays"
                    min="0"
                    step="0.5"
                    value={newTestPlan.estimatedDays}
                    onChange={handleTestPlanInputChange}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreatingPlan(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleCreateTestPlan}
                disabled={!selectedProjectId}
              >
                Crear Plan de Pruebas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}