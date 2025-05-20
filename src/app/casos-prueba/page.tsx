'use client';

import { useState } from 'react';
import TestCaseTable from '@/components/testcases/TestCaseTable';
import TestCaseStats from '@/components/testcases/TestCaseStats';
import TestCaseAdvancedStats from '@/components/testcases/TestCaseAdvancedStats';
import TestCaseDefectTracker from '@/components/testcases/TestCaseDefectTracker';
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

export default function TestCasesPage() {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('cases');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const { testCases } = useTestCases(selectedProjectId);
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

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
    
    // Si hay un proyecto seleccionado, pre-llenar algunos datos del plan
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Sistema de Gestión de Casos de Prueba</h1>
          <p className="text-gray-600">Crea y gestiona tus casos de prueba y planes de calidad</p>
        </div>
        
        <Button onClick={() => setIsCreatingPlan(true)}>
          Nuevo Plan de Pruebas
        </Button>      </div>
      
      <div className="mb-8">
        <div className="max-w-md">
          <label className="block text-sm font-medium mb-2">Seleccionar Proyecto</label>
          <Select
            value={selectedProjectId}
            onChange={handleProjectChange}
          >
            <option value="">Todos los proyectos</option>
            {projects.map((project) => (
              <option key={project.id || project.idJira} value={project.idJira}>
                {project.proyecto}
              </option>
            ))}
          </Select>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="cases">Casos de Prueba</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            <TabsTrigger value="advanced">Métricas Avanzadas</TabsTrigger>
            <TabsTrigger value="defects">Defectos</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <ExcelTestCaseImportExport projectId={selectedProjectId} />
            <Button onClick={() => setIsCreatingPlan(true)}>
              Nuevo Plan de Pruebas
            </Button>
          </div>
        </div>
        
        <TabsContent value="cases" className="mt-6">
          <TestCaseTable projectId={selectedProjectId} />
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <TestCaseStats projectId={selectedProjectId} />
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-6">
          <TestCaseAdvancedStats projectId={selectedProjectId} />
        </TabsContent>
        
        <TabsContent value="defects" className="mt-6">
          <TestCaseDefectTracker projectId={selectedProjectId} />
        </TabsContent>
      </Tabs>
      
      {isCreatingPlan && (
        <Dialog open={isCreatingPlan} onOpenChange={setIsCreatingPlan}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Nuevo Plan de Pruebas</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Proyecto</Label>
                <Select
                  id="projectId"
                  name="projectId"
                  value={newTestPlan.projectId}
                  onChange={(e) => {
                    const selectedProject = projects.find(p => p.id === e.target.value || p.idJira === e.target.value);
                    setNewTestPlan(prev => ({
                      ...prev,
                      projectId: e.target.value,
                      projectName: selectedProject?.proyecto || '',
                      codeReference: selectedProject?.idJira || ''
                    }));
                  }}
                  disabled={!!selectedProjectId}
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id || project.idJira} value={project.idJira}>
                      {project.proyecto}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="codeReference">Código de Referencia</Label>
                <Input
                  id="codeReference"
                  name="codeReference"
                  value={newTestPlan.codeReference || ''}
                  onChange={handleTestPlanInputChange}
                  placeholder="SRCA-XXXX"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha Inicio</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={newTestPlan.startDate}
                    onChange={handleTestPlanInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha Fin</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={newTestPlan.endDate || ''}
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
                    step="0.5"
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
      )}
    </div>
  );
}
