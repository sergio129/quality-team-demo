'use client';

import { useState } from 'react';
import { useTestPlans, createTestPlan } from '@/hooks/useTestCases';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
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

interface TestCasePlanManagerProps {
  onPlanSelected: (planId: string) => void;
}

export default function TestCasePlanManager({ onPlanSelected }: TestCasePlanManagerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const { projects } = useProjects();
  const { testPlans, isLoading } = useTestPlans(selectedProjectId);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Planes de Prueba</h2>
          <p className="text-gray-500">Gestiona los planes de prueba del proyecto</p>
        </div>

        <Button onClick={() => setIsCreatingPlan(true)}>
          Nuevo Plan de Pruebas
        </Button>
      </div>

      <div className="mb-4">
        <Label>Seleccionar Proyecto</Label>
        <Select 
          value={selectedProjectId} 
          onChange={handleProjectChange}
          className="max-w-md"
        >
          <option value="">Seleccionar proyecto</option>
          {projects.map((project) => (
            <option key={project.id || project.idJira} value={project.idJira}>
              {project.proyecto}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : testPlans && testPlans.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referencia</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Casos Totales</TableHead>
                <TableHead>Calidad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.codeReference}</TableCell>
                  <TableCell>{plan.projectName}</TableCell>
                  <TableCell>{format(new Date(plan.startDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{plan.endDate ? format(new Date(plan.endDate), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell>{plan.totalCases}</TableCell>
                  <TableCell>{plan.testQuality}%</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => onPlanSelected(plan.id)}
                    >
                      Gestionar Casos
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 border rounded-md">
          <p className="text-gray-500">No hay planes de prueba disponibles para este proyecto.</p>
        </div>
      )}

      <Dialog open={isCreatingPlan} onOpenChange={setIsCreatingPlan}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nuevo Plan de Pruebas</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Proyecto</Label>
              <Select
                id="projectId"
                value={newTestPlan.projectId}
                onChange={handleProjectChange}
                required
              >
                <option value="">Seleccionar proyecto</option>
                {projects.map((project) => (
                  <option key={project.id || project.idJira} value={project.idJira}>
                    {project.proyecto}
                  </option>
                ))}
              </Select>
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
    </div>
  );
}
