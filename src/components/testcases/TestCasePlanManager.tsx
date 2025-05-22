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
import { mutate } from 'swr';
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

interface TestCasePlanManagerProps {
  onPlanSelected: (planId: string) => void;
}

export default function TestCasePlanManager({ onPlanSelected }: TestCasePlanManagerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const { projects } = useProjects();
  const { testPlans, isLoading } = useTestPlans();
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
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
  };
  const handleCreateTestPlan = async () => {
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
    setNewTestPlan({
      ...plan,
      startDate: new Date(plan.startDate).toISOString().split('T')[0],
      endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : ''
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

  return (
    <div className="space-y-4">      
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Planes de Prueba</h2>
        <p className="text-gray-500">Gestiona los planes de prueba del proyecto</p>
      </div>

      <div className="mb-4">
        <Label>Proyecto</Label>
        <Select 
          value={selectedProjectId} 
          onChange={handleProjectChange}
          className="max-w-md"
        >
          <option value="">Seleccionar proyecto</option>
          {projectsWithPlans.map((project) => {
            const planCount = testPlans?.filter(p => p.projectId === project.idJira).length || 0;
            const isUrgent = project.fechaEntrega && 
              (new Date(project.fechaEntrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 30;
            
            return (
              <option 
                key={project.idJira} 
                value={project.idJira}
                className={isUrgent ? 'text-red-600 font-medium' : ''}
              >
                {project.proyecto} ({planCount} {planCount === 1 ? 'plan' : 'planes'})
              </option>
            );
          })}
        </Select>
        {!isLoading && projectsWithPlans.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            No hay proyectos con planes de prueba. Crea un nuevo plan para comenzar.
          </p>
        )}      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Lista de Planes</h3>
        <div className="flex gap-2">
          <UpdateQualityButton />
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsCreatingPlan(true)}
          >
            Nuevo Plan
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : testPlans && testPlans.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>                <TableHead>Referencia</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Casos Totales</TableHead>
                <TableHead className="flex items-center gap-1">
                  Calidad
                  <QualityInfoButton />
                </TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testPlans.map((plan) => (
                <TableRow key={plan.id}>                  <TableCell>{plan.codeReference}</TableCell>
                  <TableCell>{plan.projectName}</TableCell>
                  <TableCell>{format(new Date(plan.startDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{plan.endDate ? format(new Date(plan.endDate), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell>{plan.totalCases}</TableCell>
                  <TableCell>{plan.testQuality === -1 ? 'N/A' : `${plan.testQuality}%`}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPlanSelected(plan.id)}
                      >
                        Gestionar Casos
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                      >
                        Editar
                      </Button>
                    </div>
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
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
