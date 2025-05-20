'use client';

import { useState, useRef } from 'react';
import { TestCase, TestEvidence } from '@/models/TestCase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { addTestEvidence } from '@/hooks/useTestCases';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Trash2, Save, Camera, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface TestCaseEvidenceProps {
  testCase: TestCase;
  onSaved?: () => void;
}

export default function TestCaseEvidence({ testCase, onSaved }: TestCaseEvidenceProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  
  const [newEvidence, setNewEvidence] = useState<Partial<TestEvidence>>({
    id: uuidv4(),
    date: new Date().toISOString().split('T')[0],
    tester: '',
    precondition: '',
    steps: [''],
    screenshots: [],
    result: 'Exitoso',
    comments: ''
  });
  
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEvidence(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleStepChange = (index: number, value: string) => {
    setNewEvidence(prev => {
      const updatedSteps = [...(prev.steps || [''])];
      updatedSteps[index] = value;
      return {
        ...prev,
        steps: updatedSteps
      };
    });
  };
  
  const addStep = () => {
    setNewEvidence(prev => ({
      ...prev,
      steps: [...(prev.steps || []), '']
    }));
  };
  
  const removeStep = (index: number) => {
    setNewEvidence(prev => {
      const steps = [...(prev.steps || [''])];
      steps.splice(index, 1);
      if (steps.length === 0) steps.push('');
      return {
        ...prev,
        steps
      };
    });
  };
  
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newImages = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
  };
  
  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };
  
  const handleSaveEvidence = async () => {
    if (!newEvidence.tester) {
      toast.error('Por favor, ingresa el nombre del tester');
      return;
    }
    
    if (!newEvidence.steps || newEvidence.steps.some(s => !s)) {
      toast.error('Por favor, completa todos los pasos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // En un entorno real, aquí subirías las imágenes a un servidor
      // Por ahora, usaremos URLs simuladas
      const imageUrls = uploadedImages.map((_, index) => `evidence-${testCase.id}-${Date.now()}-${index}`);
      
      const evidenceToSave: TestEvidence = {
        ...newEvidence as TestEvidence,
        screenshots: imageUrls,
        id: uuidv4()
      };
      
      // Unir con evidencias existentes
      const updatedEvidences = [...(testCase.evidences || []), evidenceToSave];
      
      await addTestEvidence(testCase.id, updatedEvidences);
      
      // Limpiar el formulario
      setNewEvidence({
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        tester: '',
        precondition: '',
        steps: [''],
        screenshots: [],
        result: 'Exitoso',
        comments: ''
      });
      setUploadedImages([]);
      
      toast.success('Evidencia guardada correctamente');
      setIsDialogOpen(false);
      if (onSaved) onSaved();
    } catch (error) {
      toast.error('Error al guardar la evidencia');
      console.error('Error al guardar evidencia:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExportEvidence = () => {
    try {
      // Crear el documento de evidencia
      const rows = [
        ['Evidencias -'],
        [''],
        ['N° Caso', testCase.codeRef],
        ['Fecha:', new Date(newEvidence.date).toLocaleDateString()],
        ['Nombre Tester:', newEvidence.tester],
        [''],
        ['Descripción'],
        [''],
        ['Precondición / Contexto:', newEvidence.precondition],
        [''],
        ['Pasos']
      ];
      
      // Añadir pasos
      newEvidence.steps?.forEach((step, index) => {
        rows.push([`${index + 1}. ${step}`]);
      });
      
      rows.push([''], ['Evidencias']);
      
      // Crear hoja de trabajo
      const ws = XLSX.utils.aoa_to_sheet(rows);
      
      // Aplicar estilos (mergear celdas)
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } },
        { s: { r: 8, c: 0 }, e: { r: 8, c: 4 } },
        { s: { r: 10, c: 0 }, e: { r: 10, c: 4 } },
        { s: { r: 12 + (newEvidence.steps?.length || 0), c: 0 }, e: { r: 12 + (newEvidence.steps?.length || 0), c: 4 } }
      );
      
      // Crear libro
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Evidencia');
      
      // Generar archivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Guardar archivo
      saveAs(data, `evidencia_${testCase.codeRef}_${newEvidence.date}.xlsx`);
      
      toast.success('Formato de evidencia exportado');
    } catch (error) {
      console.error('Error al exportar evidencia:', error);
      toast.error('Error al exportar formato de evidencia');
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Camera size={16} /> Registrar Evidencia
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[95%] md:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Registrar Evidencia - {testCase.codeRef}: {testCase.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportEvidence}
                className="ml-4"
              >
                Exportar Formato
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Encabezado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="evidenceDate">Fecha</Label>
                <Input
                  id="evidenceDate"
                  name="date"
                  type="date"
                  value={newEvidence.date || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tester">Nombre del Tester</Label>
                <Input
                  id="tester"
                  name="tester"
                  value={newEvidence.tester || ''}
                  onChange={handleInputChange}
                  placeholder="Nombre completo del tester"
                  required
                />
              </div>
            </div>
            
            {/* Descripción */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold border-b pb-2">Descripción</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="precondition">Precondición / Contexto:</Label>
                  <textarea
                    id="precondition"
                    name="precondition"
                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                    value={newEvidence.precondition || ''}
                    onChange={handleInputChange}
                    placeholder="Ej: El usuario tiene permisos de administrador y acceso a la parametrización 'Prefijos'."
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Pasos */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold border-b pb-2">Pasos</h3>
              
              <div className="space-y-2">
                {newEvidence.steps?.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="py-2 px-1 text-sm text-gray-500">{index + 1}.</span>
                    <Input
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder={`Ej: Ingresar al módulo de parametrización "Prefijos"`}
                      className="flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      disabled={newEvidence.steps?.length === 1}
                      className="h-auto"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                  className="mt-2"
                >
                  <PlusCircle size={16} className="mr-2" /> Añadir Paso
                </Button>
              </div>
            </div>
            
            {/* Evidencias */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Evidencias</h3>
              
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                <input
                  ref={screenshotInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => screenshotInputRef.current?.click()}
                >
                  <Camera size={16} className="mr-2" /> Añadir Capturas de Pantalla
                </Button>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative border rounded-md overflow-hidden">
                      <img
                        src={image.preview}
                        alt={`Evidencia ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                        onClick={() => removeImage(index)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Resultado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="result">Resultado de la Prueba</Label>
                <select
                  id="result"
                  name="result"
                  className="w-full px-3 py-2 border rounded-md"
                  value={newEvidence.result || 'Exitoso'}
                  onChange={handleInputChange}
                >
                  <option value="Exitoso">Exitoso</option>
                  <option value="Fallido">Fallido</option>
                  <option value="No ejecutado">No ejecutado</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comments">Comentarios (opcional)</Label>
                <textarea
                  id="comments"
                  name="comments"
                  className="w-full px-3 py-2 border rounded-md"
                  value={newEvidence.comments || ''}
                  onChange={handleInputChange}
                  placeholder="Observaciones adicionales sobre la ejecución del caso"
                ></textarea>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEvidence}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save size={16} /> {isLoading ? 'Guardando...' : 'Guardar Evidencia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
