'use client';

import { useState, useEffect } from 'react';
import { TestCase, TestStep } from '@/models/TestCase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { createTestCase, updateTestCase } from '@/hooks/useTestCases';
import { v4 as uuidv4 } from 'uuid';
import { useProjects } from '@/hooks/useProjects';
import { PlusCircle, X, Trash2 } from 'lucide-react';

interface TestCaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  testCase?: TestCase | null;
  projectId?: string;
}

export default function TestCaseForm({ isOpen, onClose, testCase, projectId }: TestCaseFormProps) {
  const { projects } = useProjects();
  
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    id: '',
    userStoryId: '',
    name: '',
    projectId: projectId || '',
    codeRef: '',
    steps: [],
    expectedResult: '',
    testType: 'Funcional',
    status: 'No ejecutado',
    defects: [],
    evidences: [],
    cycle: 1,
    responsiblePerson: '',
    priority: 'Media'
  });
  
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [newStep, setNewStep] = useState({
    description: '',
    expected: ''
  });

  // Cuando el componente se monta o cuando cambia el testCase
  useEffect(() => {
    if (testCase) {
      setNewTestCase({
        ...testCase,
      });
      
      if (testCase.steps) {
        setSteps([...testCase.steps]);
      } else {
        setSteps([]);
      }
    } else {
      setNewTestCase({
        id: '',
        userStoryId: '',
        name: '',
        projectId: projectId || '',
        codeRef: '',
        steps: [],
        expectedResult: '',
        testType: 'Funcional',
        status: 'No ejecutado',
        defects: [],
        evidences: [],
        cycle: 1,
        responsiblePerson: '',
        priority: 'Media'
      });
      setSteps([]);
    }
  }, [testCase, projectId]);
  
  // Manejar cambios en los inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTestCase(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar la adición de un paso
  const handleAddStep = () => {
    if (!newStep.description.trim()) return;
    
    const step: TestStep = {
      id: uuidv4(),
      description: newStep.description,
      expected: newStep.expected
    };
    
    setSteps(prev => [...prev, step]);
    setNewStep({ description: '', expected: '' });
  };
  
  // Manejar la eliminación de un paso
  const handleRemoveStep = (id: string) => {
    setSteps(prev => prev.filter(step => step.id !== id));
  };
  
  // Manejar la presentación del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Incluir los pasos actuales en el caso de prueba
      const testCaseToSave = {
        ...newTestCase,
        steps: steps
      };
      
      if (testCase?.id) {
        await updateTestCase(testCase.id, testCaseToSave);
      } else {
        await createTestCase(testCaseToSave);
      }
      
      onClose();
    } catch (error) {
      console.error('Error al guardar el caso de prueba:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90%] md:max-w-[80%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {testCase ? 'Editar Caso de Prueba' : 'Nuevo Caso de Prueba'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Proyecto</Label>
              <Select
                id="projectId"
                name="projectId"
                value={newTestCase.projectId}
                onChange={handleInputChange}
                required
                disabled={!!projectId}
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
              <Label htmlFor="userStoryId">Historia de Usuario (HU)</Label>
              <Input
                id="userStoryId"
                name="userStoryId"
                placeholder="HU-01"
                value={newTestCase.userStoryId || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="codeRef">Código de Referencia</Label>
              <Input
                id="codeRef"
                name="codeRef"
                placeholder="HU1-T001"
                value={newTestCase.codeRef || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cycle">Ciclo</Label>
              <Input
                id="cycle"
                name="cycle"
                type="number"
                min="1"
                value={newTestCase.cycle || 1}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nombre del Caso de Prueba</Label>
              <Input
                id="name"
                name="name"
                placeholder="Validar selección múltiple en el campo 'Seleccionar servicio'"
                value={newTestCase.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testType">Tipo de Prueba</Label>
              <Select
                id="testType"
                name="testType"
                value={newTestCase.testType || 'Funcional'}
                onChange={handleInputChange}
                required
              >
                <option value="Funcional">Funcional</option>
                <option value="No Funcional">No Funcional</option>
                <option value="Regresión">Regresión</option>
                <option value="Exploratoria">Exploratoria</option>
                <option value="Integración">Integración</option>
                <option value="Rendimiento">Rendimiento</option>
                <option value="Seguridad">Seguridad</option>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                id="status"
                name="status"
                value={newTestCase.status || 'No ejecutado'}
                onChange={handleInputChange}
                required
              >
                <option value="No ejecutado">No ejecutado</option>
                <option value="Exitoso">Exitoso</option>
                <option value="Fallido">Fallido</option>
                <option value="Bloqueado">Bloqueado</option>
                <option value="En progreso">En progreso</option>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                id="priority"
                name="priority"
                value={newTestCase.priority || 'Media'}
                onChange={handleInputChange}
                required
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsiblePerson">Responsable</Label>
              <Input
                id="responsiblePerson"
                name="responsiblePerson"
                placeholder="Nombre del responsable"
                value={newTestCase.responsiblePerson || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="expectedResult">Resultado Esperado</Label>
              <textarea
                id="expectedResult"
                name="expectedResult"
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                placeholder="El sistema debe permitir seleccionar múltiples servicios en el campo y guardar el registro correctamente"
                value={newTestCase.expectedResult || ''}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>
          </div>
          
          {/* Pasos del caso de prueba */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-2">Pasos del Caso de Prueba</h3>
            
            <div className="space-y-4 mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start border p-3 rounded-md bg-gray-50">
                  <div className="flex-1 mr-2">
                    <div className="font-medium">Paso {index + 1}</div>
                    <div>{step.description}</div>
                    {step.expected && (
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Resultado esperado:</span> {step.expected}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStep(step.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stepDescription">Descripción del paso</Label>
                <Input
                  id="stepDescription"
                  placeholder="Ej: Hacer clic en el botón 'Guardar'"
                  value={newStep.description}
                  onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stepExpected">Resultado esperado del paso (opcional)</Label>
                <Input
                  id="stepExpected"
                  placeholder="Ej: Se guarda el registro y muestra un mensaje de confirmación"
                  value={newStep.expected}
                  onChange={(e) => setNewStep({ ...newStep, expected: e.target.value })}
                />
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddStep}
              className="mt-2"
              disabled={!newStep.description.trim()}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Añadir Paso
            </Button>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {testCase ? 'Actualizar' : 'Crear'} Caso de Prueba
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
