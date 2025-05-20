'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { TestCase } from '@/models/TestCase';
import { Incident } from '@/models/Incident';
import { updateTestCase } from '@/hooks/useTestCases';
import { PlusCircle, Search, Trash2 } from 'lucide-react';

interface TestCaseDefectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase;
}

export default function TestCaseDefectDialog({ isOpen, onClose, testCase }: TestCaseDefectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [selectedDefects, setSelectedDefects] = useState<string[]>(testCase.defects || []);
  const [newDefect, setNewDefect] = useState('');

  // Cargar incidentes cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      fetchIncidents();
    }
  }, [isOpen]);

  // Filtrar los incidentes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredIncidents(incidents);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredIncidents(
        incidents.filter(
          (inc) =>
            inc.id.toLowerCase().includes(term) ||
            inc.descripcion.toLowerCase().includes(term) ||
            inc.idJira.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, incidents]);

  const fetchIncidents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/incidents');
      if (!response.ok) throw new Error('Error al cargar incidentes');
      const data = await response.json();
      
      // Priorizar incidentes del mismo proyecto si está disponible
      let sorted = [...data];
      if (testCase.projectId) {
        sorted = sorted.sort((a, b) => {
          // Si encontramos algo en el idJira o descripción que coincide con el proyecto del caso de prueba
          const aMatchesProject = (a.idJira || '').includes(testCase.projectId) || (a.descripcion || '').includes(testCase.projectId);
          const bMatchesProject = (b.idJira || '').includes(testCase.projectId) || (b.descripcion || '').includes(testCase.projectId);
          
          if (aMatchesProject && !bMatchesProject) return -1;
          if (!aMatchesProject && bMatchesProject) return 1;
          return 0;
        });
      }
      
      setIncidents(sorted);
      setFilteredIncidents(sorted);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast.error('Error al cargar los incidentes');
    } finally {
      setIsLoading(false);
    }
  };

  const addDefect = (defectId: string) => {
    if (!selectedDefects.includes(defectId)) {
      setSelectedDefects([...selectedDefects, defectId]);
    }
  };

  const removeDefect = (defectId: string) => {
    setSelectedDefects(selectedDefects.filter(id => id !== defectId));
  };

  const handleAddCustomDefect = () => {
    if (newDefect.trim()) {
      addDefect(newDefect.trim());
      setNewDefect('');
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Actualizar el caso de prueba con los defectos
      const updatedTestCase = {
        ...testCase,
        defects: selectedDefects,
        // Si hay defectos y el estado es "Exitoso", cambiarlo a "Fallido"
        status: selectedDefects.length > 0 && testCase.status === 'Exitoso' 
          ? 'Fallido' 
          : testCase.status
      };
      
      await updateTestCase(updatedTestCase);
      toast.success('Defectos vinculados correctamente');
      onClose();
    } catch (error) {
      toast.error('Error al guardar los defectos');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestionar Defectos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Caso de Prueba</Label>
            <div className="p-2 bg-gray-50 rounded border">
              <span className="font-medium">{testCase.codeRef}</span> - {testCase.name}
            </div>
          </div>
          
          {/* Defectos seleccionados */}
          <div className="space-y-2">
            <Label>Defectos Vinculados ({selectedDefects.length})</Label>
            {selectedDefects.length === 0 ? (
              <div className="text-sm text-gray-500 italic">No hay defectos vinculados</div>
            ) : (
              <div className="space-y-2">
                {selectedDefects.map(defectId => {
                  const incident = incidents.find(inc => inc.id === defectId);
                  return (
                    <div key={defectId} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                      <div>
                        <span className="font-medium">{defectId}</span>
                        {incident && (
                          <span className="ml-2 text-sm text-gray-700">
                            {incident.descripcion.substring(0, 60)}
                            {incident.descripcion.length > 60 ? '...' : ''}
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeDefect(defectId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Añadir defecto manualmente */}
          <div className="space-y-2">
            <Label>Añadir ID de Defecto Manualmente</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Ej: INC-20250511-001, SRCA-1234"
                value={newDefect}
                onChange={(e) => setNewDefect(e.target.value)}
              />
              <Button type="button" onClick={handleAddCustomDefect}>
                <PlusCircle className="h-4 w-4 mr-1" />
                Añadir
              </Button>
            </div>
          </div>
          
          {/* Buscar en incidentes */}
          <div className="space-y-2">
            <Label>Buscar en Incidentes Existentes</Label>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por ID, descripción o referencia Jira"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="border rounded-md h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                  No se encontraron incidentes
                </div>
              ) : (
                <div className="divide-y">
                  {filteredIncidents.slice(0, 50).map(incident => (
                    <div 
                      key={incident.id} 
                      className={`p-3 hover:bg-gray-50 cursor-pointer ${
                        selectedDefects.includes(incident.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => addDefect(incident.id)}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{incident.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          incident.prioridad === 'Alta' ? 'bg-red-100 text-red-800' :
                          incident.prioridad === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {incident.prioridad}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        {incident.descripcion.substring(0, 100)}
                        {incident.descripcion.length > 100 ? '...' : ''}
                      </div>
                      {incident.idJira && (
                        <div className="text-xs text-gray-500 mt-1">
                          Jira: {incident.idJira}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
