'use client';

import { useState } from 'react';
import { TestCase, TestEvidence } from '@/models/TestCase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateTestCase } from '@/hooks/useTestCases';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Upload, Image, CheckCircle, XCircle, AlertTriangle, Bug } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TestCaseDefectDialog from './TestCaseDefectDialog';

interface TestCaseDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase;
}

export default function TestCaseDetailsDialog({ isOpen, onClose, testCase }: TestCaseDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('details');  const [newEvidence, setNewEvidence] = useState<Partial<TestEvidence>>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    tester: '',
    precondition: '',
    steps: [''],
    screenshots: [],
    result: 'Exitoso',
    comments: ''
  });
  
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [isDefectDialogOpen, setIsDefectDialogOpen] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvidence(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar cambios en los pasos
  const handleStepChange = (index: number, value: string) => {
    const updatedSteps = [...(newEvidence.steps || [''])];
    updatedSteps[index] = value;
    setNewEvidence(prev => ({
      ...prev,
      steps: updatedSteps
    }));
  };
  
  // Añadir un paso en blanco
  const addStep = () => {
    setNewEvidence(prev => ({
      ...prev,
      steps: [...(prev.steps || []), '']
    }));
  };
  
  // Eliminar un paso
  const removeStep = (index: number) => {
    const updatedSteps = [...(newEvidence.steps || [''])];
    updatedSteps.splice(index, 1);
    setNewEvidence(prev => ({
      ...prev,
      steps: updatedSteps
    }));
  };
  
  // Manejar subida de imágenes
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
  };
  
  // Eliminar una imagen
  const removeImage = (index: number) => {
    const updatedImages = [...uploadedImages];
    URL.revokeObjectURL(updatedImages[index].preview);
    updatedImages.splice(index, 1);
    setUploadedImages(updatedImages);
  };
  
  // Guardar evidencia
  const handleSaveEvidence = async () => {
    try {
      // En un entorno real, aquí subirías las imágenes a un servidor
      // Por ahora, usaremos una URL simulada
      const imageUrls = uploadedImages.map((_, index) => `sample-evidence-${index}.jpg`);
      
      const evidenceToSave: TestEvidence = {
        ...newEvidence as TestEvidence,
        id: uuidv4(),
        screenshots: imageUrls
      };
      
      const updatedEvidences = [...(testCase.evidences || []), evidenceToSave];
      
      await updateTestCase(testCase.id, {
        evidences: updatedEvidences,
        // Si la evidencia es exitosa o fallida, actualizar el estado del caso
        status: evidenceToSave.result
      });
      
      toast.success('Evidencia guardada correctamente');
      setIsAddingEvidence(false);
      setNewEvidence({
        id: '',
        date: new Date().toISOString().split('T')[0],
        tester: '',
        precondition: '',
        steps: [''],
        screenshots: [],
        result: 'Exitoso',
        comments: ''
      });
      setUploadedImages([]);
    } catch (error) {
      toast.error('Error al guardar la evidencia');
    }
  };
  
  const getStatusIcon = (status: string) => {
    if (status === 'Exitoso') {
      return <CheckCircle className="text-green-500 h-5 w-5" />;
    } else if (status === 'Fallido') {
      return <XCircle className="text-red-500 h-5 w-5" />;
    } else {
      return <AlertTriangle className="text-yellow-500 h-5 w-5" />;
    }
  };
  
  return (    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90%] md:max-w-[80%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="flex gap-2 items-center">
              <span>{testCase.codeRef}: {testCase.name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                testCase.status === 'Exitoso' ? 'bg-green-100 text-green-800' :
                testCase.status === 'Fallido' ? 'bg-red-100 text-red-800' :
                testCase.status === 'Bloqueado' ? 'bg-orange-100 text-orange-800' :
                testCase.status === 'En progreso' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {testCase.status}
              </span>
            </DialogTitle>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDefectDialogOpen(true);
                }}
                className={testCase.defects?.length ? "border-red-500 text-red-600 hover:bg-red-50" : ""}
              >
                <Bug className="h-4 w-4 mr-1" />
                {testCase.defects?.length 
                  ? `Defectos (${testCase.defects.length})` 
                  : "Gestionar Defectos"}
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="steps">Pasos</TabsTrigger>
            <TabsTrigger value="evidence">Evidencias ({testCase.evidences?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Historia de Usuario (HU)</div>
                <div className="border p-2 rounded-md bg-gray-50">{testCase.userStoryId}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Código de Referencia</div>
                <div className="border p-2 rounded-md bg-gray-50">{testCase.codeRef}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Tipo de Prueba</div>
                <div className="border p-2 rounded-md bg-gray-50">{testCase.testType}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Ciclo</div>
                <div className="border p-2 rounded-md bg-gray-50">{testCase.cycle}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Prioridad</div>
                <div className="border p-2 rounded-md bg-gray-50">{testCase.priority}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Responsable</div>
                <div className="border p-2 rounded-md bg-gray-50">{testCase.responsiblePerson || '-'}</div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <div className="text-sm font-medium">Resultado Esperado</div>
                <div className="border p-3 rounded-md bg-gray-50">{testCase.expectedResult}</div>
              </div>
              
              {testCase.defects && testCase.defects.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Defectos Relacionados</div>
                  <div className="border p-3 rounded-md bg-gray-50">
                    <ul className="list-disc pl-5">
                      {testCase.defects.map((defect, index) => (
                        <li key={index}>{defect}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="steps" className="space-y-4 py-4">
            <div className="space-y-4">
              {testCase.steps && testCase.steps.map((step, index) => (
                <div key={step.id} className="border p-4 rounded-md bg-gray-50">
                  <div className="font-medium mb-2">Paso {index + 1}</div>
                  <div className="mb-2">{step.description}</div>
                  {step.expected && (
                    <div className="mt-1 text-sm text-gray-600">
                      <span className="font-medium">Resultado esperado:</span> {step.expected}
                    </div>
                  )}
                </div>
              ))}
              
              {(!testCase.steps || testCase.steps.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No hay pasos definidos para este caso de prueba.
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="evidence" className="space-y-4 py-4">
            {isAddingEvidence ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Añadir Nueva Evidencia</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha</label>
                    <input
                      type="date"
                      name="date"
                      className="w-full px-3 py-2 border rounded-md"
                      value={newEvidence.date?.toString().split('T')[0]}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tester</label>
                    <input
                      type="text"
                      name="tester"
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Nombre del tester"
                      value={newEvidence.tester || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Precondición / Contexto</label>
                    <textarea
                      name="precondition"
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      placeholder="Precondiciones necesarias para la prueba"
                      value={newEvidence.precondition || ''}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Pasos Ejecutados</label>
                    {newEvidence.steps?.map((step, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <span className="mr-2 text-sm">{index + 1}.</span>
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border rounded-md"
                          value={step}
                          onChange={(e) => handleStepChange(index, e.target.value)}
                          placeholder={`Paso ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                          className="ml-2"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addStep}
                    >
                      + Añadir Paso
                    </Button>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Capturas de Pantalla</label>
                    <div className="border-dashed border-2 p-4 text-center rounded-md">
                      <input
                        type="file"
                        id="screenshots"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <label htmlFor="screenshots" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-1">Click para subir imágenes</p>
                      </label>
                    </div>
                    
                    {uploadedImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image.preview}
                              alt={`Screenshot ${index + 1}`}
                              className="h-32 w-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                              onClick={() => removeImage(index)}
                            >
                              <XCircle className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Resultado</label>
                    <select
                      name="result"
                      className="w-full px-3 py-2 border rounded-md"
                      value={newEvidence.result}
                      onChange={handleInputChange}
                    >
                      <option value="Exitoso">Exitoso</option>
                      <option value="Fallido">Fallido</option>
                      <option value="No ejecutado">No ejecutado</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Comentarios</label>
                    <textarea
                      name="comments"
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      placeholder="Observaciones adicionales sobre la ejecución"
                      value={newEvidence.comments || ''}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingEvidence(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveEvidence}
                  >
                    Guardar Evidencia
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Evidencias Registradas</h3>
                  <Button onClick={() => setIsAddingEvidence(true)}>
                    Nueva Evidencia
                  </Button>
                </div>
                
                {(!testCase.evidences || testCase.evidences.length === 0) ? (
                  <div className="text-center py-8 border rounded-md bg-gray-50">
                    <p className="text-gray-500">No hay evidencias registradas para este caso de prueba.</p>
                    <Button
                      className="mt-2"
                      variant="outline"
                      onClick={() => setIsAddingEvidence(true)}
                    >
                      Añadir Primera Evidencia
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {testCase.evidences.map((evidence, idx) => (
                      <div key={evidence.id || idx} className="border rounded-md overflow-hidden">
                        <div className="flex items-center justify-between bg-gray-100 p-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(evidence.result)}
                            <span className="font-medium">
                              {evidence.date ? new Date(evidence.date).toLocaleDateString() : 'Sin fecha'}
                            </span>
                            {evidence.tester && (
                              <span className="text-gray-600">- Tester: {evidence.tester}</span>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            evidence.result === 'Exitoso' ? 'bg-green-100 text-green-800' :
                            evidence.result === 'Fallido' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {evidence.result}
                          </span>
                        </div>
                        
                        <div className="p-4 space-y-4">
                          {evidence.precondition && (
                            <div>
                              <div className="font-medium mb-1">Precondición / Contexto:</div>
                              <div className="bg-gray-50 p-2 rounded-md">{evidence.precondition}</div>
                            </div>
                          )}
                          
                          {evidence.steps && evidence.steps.length > 0 && (
                            <div>
                              <div className="font-medium mb-1">Pasos Ejecutados:</div>
                              <ol className="list-decimal pl-6 space-y-1">
                                {evidence.steps.map((step, index) => (
                                  <li key={index}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                          
                          {evidence.screenshots && evidence.screenshots.length > 0 && (
                            <div>
                              <div className="font-medium mb-1">Capturas de Pantalla:</div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {evidence.screenshots.map((screenshot, index) => (
                                  <div key={index} className="relative">
                                    <div className="bg-gray-200 h-24 flex items-center justify-center rounded-md">
                                      <Image className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div className="text-xs text-center mt-1">{screenshot}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {evidence.comments && (
                            <div>
                              <div className="font-medium mb-1">Comentarios:</div>
                              <div className="bg-gray-50 p-2 rounded-md">{evidence.comments}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>        </DialogFooter>
      </DialogContent>
      
      {isDefectDialogOpen && (
        <TestCaseDefectDialog
          isOpen={isDefectDialogOpen}
          onClose={() => setIsDefectDialogOpen(false)}
          testCase={testCase}
        />
      )}
    </Dialog>
  );
}
