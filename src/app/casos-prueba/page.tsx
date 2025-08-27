'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TestCaseTable from '@/components/testcases/TestCaseTable';
import TestCaseStats from '@/components/testcases/TestCaseStats';
import TestCaseDefectTracker from '@/components/testcases/TestCaseDefectTracker';
import TestCasePlanManager from '@/components/testcases/TestCasePlanManager';
import TestCaseExport from '@/components/testcases/TestCaseExport';
import SelectTestPlan from '@/components/testcases/SelectTestPlan';
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
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TestCasesPage() {
  // Hooks de autenticación
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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

  // Hook para manejar clics fuera del dropdown (siempre se ejecuta)
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

  // Verificar autenticación antes de mostrar contenido
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay sesión, no mostrar nada (se redirigirá)
  if (!session) {
    return null;
  }

  const filteredProjects = useMemo(() => {
    const searchTermLower = projectSearchTerm.toLowerCase();
    return projects.filter((project) => {
      return (
        project.proyecto?.toLowerCase().includes(searchTermLower) ||
        project.idJira?.toLowerCase().includes(searchTermLower)
      );
    });
  }, [projects, projectSearchTerm]);

  const getActiveProjects = useCallback(() => {
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
  }, [projects, projectSearchInDialog]);

  const handleProjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
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
  }, [projects]);
  
  const handleTestPlanInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTestPlan(prev => ({
      ...prev,
      [name]: name === 'estimatedHours' || name === 'estimatedDays' || name === 'testQuality'
        ? parseFloat(value)
        : value
    }));
  }, []);
  
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
    <div key={`testcases-${selectedProjectId}-${selectedTestPlanId}-${activeTab}`} className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Sistema de Gestión de Casos de Prueba</h1>
          <p className="text-gray-600">Crea y gestiona tus casos de prueba y planes de calidad</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">          <div>
            <label htmlFor="projectSearch" className="block text-sm font-medium mb-2">Buscar/Seleccionar Proyecto</label>
            <div className="relative">
              <div className="flex">
                <Input
                  id="projectSearch"
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
                    <ul role="listbox" aria-label="Lista de proyectos">
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      <button 
                        className="w-full text-left bg-transparent border-0 p-0 focus:outline-blue-500" 
                        onClick={() => {
                          clearProjectSelection();
                          setShowProjectDropdown(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            clearProjectSelection();
                            setShowProjectDropdown(false);
                          }
                        }}
                      >
                        <div className="font-medium">Todos los proyectos</div>
                      </button>
                    </li>
                    {filteredProjects.map((project) => (
                      <li 
                        key={project.id || project.idJira} 
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <button
                          className="w-full text-left bg-transparent border-0 p-0 focus:outline-blue-500"
                          onClick={() => selectProject(project)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              selectProject(project);
                            }
                          }}
                        >
                          <div className="font-medium">{project.proyecto}</div>
                          {project.idJira && <div className="text-xs text-gray-500">ID Jira: {project.idJira}</div>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
            <div>
            <SelectTestPlan 
              testPlans={testPlans} 
              selectedPlanId={selectedTestPlanId} 
              onSelectPlan={(planId) => setSelectedTestPlanId(planId)}
            />
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
            <TestCaseExport projectId={selectedProjectId} testCases={testCases} />
            <Button
              onClick={() => setIsCreatingPlan(true)}
              style={{ display: activeTab === 'cases' ? 'none' : 'inline-flex' }}
            >
              Nuevo Plan de Pruebas
            </Button>
          </div>
        </div>

        <TabsContent value="plans">
          <TestCasePlanManager
            key={`plans-${selectedProjectId}`}
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
            key={`cases-${selectedProjectId}-${selectedTestPlanId}`}
            projectId={selectedProjectId}
            testPlanId={selectedTestPlanId}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <TestCaseStats
            key={`stats-${selectedProjectId}-${selectedTestPlanId}`}
            projectId={selectedProjectId}
            testPlanId={selectedTestPlanId}
          />
        </TabsContent>

        <TabsContent value="defects" className="mt-6">
          <TestCaseDefectTracker
            key={`defects-${selectedProjectId}-${selectedTestPlanId}`}
            projectId={selectedProjectId}
            testPlanId={selectedTestPlanId}
          />
        </TabsContent>
      </Tabs>
      
      {isCreatingPlan && (
        <Dialog open={isCreatingPlan} onOpenChange={setIsCreatingPlan}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Nuevo Plan de Pruebas</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Proyecto</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar por nombre, ID o equipo..."
                    value={projectSearchInDialog}
                    onChange={(e) => setProjectSearchInDialog(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {projectSearchInDialog.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-[200px] overflow-y-auto rounded-md border bg-white shadow-lg">
                    {getActiveProjects().map((project) => (
                      <div
                        key={project.idJira}
                        className="cursor-pointer p-2 hover:bg-gray-50 border-b last:border-b-0"                        onClick={() => {
                          // Usar fecha de entrega como fecha de inicio y fecha de certificación como fecha fin
                          const startDate = project.fechaEntrega ? new Date(project.fechaEntrega).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                          const endDate = project.fechaCertificacion ? new Date(project.fechaCertificacion).toISOString().split('T')[0] : '';
                            // Calcular días estimados entre fecha de entrega y certificación, o fecha actual y fecha de entrega
                          let daysEstimated = 0;
                          if (project.fechaEntrega) {
                            const today = new Date();
                            const entregaDate = new Date(project.fechaEntrega);
                            // Si hay certificación, usar esa fecha para el cálculo
                            const targetDate = project.fechaCertificacion ? new Date(project.fechaCertificacion) : entregaDate;
                            const diffTime = Math.abs(targetDate.getTime() - today.getTime());
                            daysEstimated = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          }// Calcular horas estimadas (9 horas por día laborable)
                          const hoursEstimated = daysEstimated * 9;

                          setSelectedProjectId(project.idJira || '');
                          setProjectSearchInDialog('');
                          setNewTestPlan(prev => ({
                            ...prev,
                            projectId: project.idJira || '',
                            projectName: project.proyecto || '',
                            codeReference: project.idJira || '',
                            startDate,
                            endDate,
                            estimatedDays: daysEstimated,
                            estimatedHours: hoursEstimated
                          }));
                        }}
                      >
                        <div className="font-medium">{project.proyecto}</div>
                        <div className="text-sm text-gray-500">ID: {project.idJira}</div>
                        {project.fechaEntrega && (
                          <div className="text-xs text-gray-500 mt-1">
                            Entrega: {new Date(project.fechaEntrega).toLocaleDateString()}
                            {project.fechaCertificacion && (
                              <span className="ml-2">
                                Certificación: {new Date(project.fechaCertificacion).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {getActiveProjects().length === 0 && (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        No se encontraron proyectos activos
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Código de Referencia</Label>
                <Input
                  value={newTestPlan.codeReference}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input
                    type="date"
                    name="startDate"
                    value={newTestPlan.startDate}
                    onChange={handleTestPlanInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    name="endDate"
                    value={newTestPlan.endDate}
                    onChange={handleTestPlanInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horas Est.</Label>
                  <Input
                    type="number"
                    name="estimatedHours"
                    min="0"
                    value={newTestPlan.estimatedHours}
                    onChange={handleTestPlanInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Días Est.</Label>
                  <Input
                    type="number"
                    name="estimatedDays"
                    min="0"
                    step="0.5"
                    value={newTestPlan.estimatedDays}
                    onChange={handleTestPlanInputChange}
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