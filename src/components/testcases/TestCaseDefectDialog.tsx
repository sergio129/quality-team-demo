'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { TestCase } from '@/models/TestCase';
import { Incident, BugType, AreaAfectada } from '@/models/Incident';
import { updateTestCase } from '@/hooks/useTestCases';
import { createIncident } from '@/hooks/useIncidents';
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
  const [isNewDefectFormOpen, setIsNewDefectFormOpen] = useState(false);
  const [analysts, setAnalysts] = useState<any[]>([]);
  
  const [newIncidentData, setNewIncidentData] = useState<Partial<Incident>>({
    celula: testCase.projectId || '',
    estado: 'Abierto',
    prioridad: 'Media',
    descripcion: '',
    fechaCreacion: new Date(),
    fechaReporte: new Date(),
    informadoPor: '',
    asignadoA: '',
    cliente: '',
    idJira: testCase.codeRef || '',
  });  // Cargar incidentes y analistas cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      fetchIncidents();
      fetchAnalysts();
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

  const fetchAnalysts = async () => {
    try {
      const response = await fetch('/api/analysts');
      if (!response.ok) throw new Error('Error al cargar analistas');
      const data = await response.json();
      setAnalysts(data);
    } catch (error) {
      console.error('Error loading analysts:', error);
    }
  };

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

  const handleNewIncidentChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setNewIncidentData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleCreateNewIncident = async () => {
    // Campos requeridos
    const requiredFields = ['descripcion', 'asignadoA', 'informadoPor', 'cliente', 'celula'];
    const missingFields = requiredFields.filter(field => !newIncidentData[field as keyof typeof newIncidentData]);
    
    if (missingFields.length > 0) {
      toast.error(`Por favor completa los siguientes campos: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setIsLoading(true);
      
      // Asegurarse de que idJira y fechaReporte tengan valores por defecto
      const incidentToCreate = {
        ...newIncidentData,
        idJira: newIncidentData.idJira || testCase.codeRef || '',
        fechaReporte: newIncidentData.fechaReporte || new Date(),
        // Asegurar que los valores booleanos estén definidos
        esErroneo: newIncidentData.esErroneo || false,
        aplica: newIncidentData.aplica !== undefined ? newIncidentData.aplica : true
      };

      // Crear el incidente
      const result = await createIncident(incidentToCreate as any);
      
      // Si la creación fue exitosa, añadir el nuevo ID a la lista de defectos seleccionados
      if (result) {
        const newIncident = await result.unwrap();
        
        if (newIncident && newIncident.id) {
          addDefect(newIncident.id);
          setIsNewDefectFormOpen(false);
          await fetchIncidents(); // Refrescar la lista de incidentes
          toast.success('Defecto creado y vinculado correctamente');
          
          // Restablecer el formulario para futuras creaciones
          setNewIncidentData({
            celula: testCase.projectId || '',
            estado: 'Abierto',
            prioridad: 'Media',
            descripcion: '',
            fechaCreacion: new Date(),
            fechaReporte: new Date(),
            informadoPor: '',
            asignadoA: '',
            cliente: '',
            idJira: testCase.codeRef || '',
          });
        }
      }
    } catch (error) {
      console.error('Error creating defect:', error);
      toast.error('Error al crear el defecto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Preparar los datos de actualización (solo los campos que vamos a cambiar)
      const testCaseUpdate = {
        defects: selectedDefects,
        // Si hay defectos y el estado es "Exitoso", cambiarlo a "Fallido"
        status: selectedDefects.length > 0 && testCase.status === 'Exitoso' 
          ? 'Fallido' 
          : testCase.status
      };
      
      // Llamar a updateTestCase con el id como primer parámetro y los datos a actualizar como segundo parámetro
      await updateTestCase(testCase.id, testCaseUpdate);
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
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-lg flex items-center gap-2">
            <span className="text-red-500">•</span>
            Gestionar Defectos
          </DialogTitle>
        </DialogHeader>          {isNewDefectFormOpen ? (
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="text-green-500">•</span>
                Nuevo Incidente
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1" 
                onClick={() => setIsNewDefectFormOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </Button>
            </div>
              <div className="space-y-4 mt-2">
              <p className="text-sm text-gray-500 mb-2">Los campos marcados con * son obligatorios</p>
              <div className="space-y-2">
                <Label>ID de JIRA</Label>
                <Input
                  value={newIncidentData.idJira || testCase.codeRef}
                  name="idJira"
                  onChange={handleNewIncidentChange}
                  placeholder="Buscar ID de JIRA..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">                <div className="space-y-2">
                  <Label htmlFor="celula">Célula *</Label>
                  <Select
                    id="celula"
                    name="celula"
                    value={newIncidentData.celula}
                    onChange={handleNewIncidentChange}
                    required
                  >
                    <option value="">Seleccionar célula...</option>
                    {/* Asegurarse de que el proyecto actual esté seleccionado por defecto */}
                    {testCase.projectId && 
                      <option value={testCase.projectId}>{testCase.projectId}</option>
                    }
                    {/* Aquí podrías agregar otras opciones de células desde alguna API o configuración */}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Input 
                    id="cliente"
                    name="cliente"
                    value={newIncidentData.cliente}
                    onChange={handleNewIncidentChange}
                    required
                  />
                </div>
                    <div className="space-y-2">
                <Label htmlFor="fechaReporte">Fecha de Reporte *</Label>
                <Input 
                  id="fechaReporte"
                  name="fechaReporte"
                  type="date"
                  value={(newIncidentData.fechaReporte instanceof Date) 
                    ? newIncidentData.fechaReporte.toISOString().split('T')[0] 
                    : new Date().toISOString().split('T')[0]}
                  onChange={handleNewIncidentChange}
                  required
                />
              </div>
              </div>
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="informadoPor">Informado Por *</Label>
                  <Select
                    id="informadoPor"
                    name="informadoPor"
                    value={newIncidentData.informadoPor}
                    onChange={handleNewIncidentChange}
                    required
                  >
                    <option value="">Seleccionar analista...</option>
                    {analysts.map(analyst => (
                      <option key={analyst.id} value={analyst.nombre}>
                        {analyst.nombre}
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="asignadoA">Asignado A *</Label>
                  <Select
                    id="asignadoA"
                    name="asignadoA"
                    value={newIncidentData.asignadoA}
                    onChange={handleNewIncidentChange}
                    required
                  >
                    <option value="">Seleccionar analista...</option>
                    {analysts.map(analyst => (
                      <option key={`assigned-${analyst.id}`} value={analyst.nombre}>
                        {analyst.nombre}
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    id="estado"
                    name="estado"
                    value={newIncidentData.estado}
                    onChange={handleNewIncidentChange}
                    required
                  >
                    <option value="Abierto">Abierto</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="Resuelto">Resuelto</option>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad *</Label>
                  <Select
                    id="prioridad"
                    name="prioridad"
                    value={newIncidentData.prioridad}
                    onChange={handleNewIncidentChange}
                    required
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipoBug">Tipo de Bug</Label>
                  <Select
                    id="tipoBug"
                    name="tipoBug"
                    value={newIncidentData.tipoBug}
                    onChange={handleNewIncidentChange}
                  >
                    <option value="">Seleccionar tipo...</option>
                    <option value="UI">UI</option>
                    <option value="Funcional">Funcional</option>
                    <option value="Performance">Performance</option>
                    <option value="Seguridad">Seguridad</option>
                    <option value="Base de Datos">Base de Datos</option>
                    <option value="Integración">Integración</option>
                    <option value="Otro">Otro</option>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="areaAfectada">Área Afectada</Label>
                  <Select
                    id="areaAfectada"
                    name="areaAfectada"
                    value={newIncidentData.areaAfectada}
                    onChange={handleNewIncidentChange}
                  >
                    <option value="">Seleccionar área...</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Base de Datos">Base de Datos</option>
                    <option value="API">API</option>
                    <option value="Infraestructura">Infraestructura</option>
                    <option value="Integración">Integración</option>
                    <option value="Otro">Otro</option>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                  value={newIncidentData.descripcion}
                  onChange={handleNewIncidentChange}
                  required
                  placeholder="Describa el incidente..."
                ></textarea>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="esErroneo"
                    name="esErroneo"
                    checked={newIncidentData.esErroneo}
                    onChange={handleNewIncidentChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="esErroneo" className="text-sm">
                    Marcado como erróneo
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="aplica"
                    name="aplica"
                    checked={newIncidentData.aplica}
                    onChange={handleNewIncidentChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="aplica" className="text-sm">
                    Aplica
                  </Label>
                </div>
              </div>
            </div>
              <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsNewDefectFormOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleCreateNewIncident} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? 'Guardando...' : 'Crear y Vincular Defecto'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-500">Caso de Prueba</Label>
              <div className="p-3 bg-gray-50 rounded-md border shadow-sm">
                <div className="font-semibold text-base">{testCase.codeRef}</div>
                <div className="text-sm text-gray-700 mt-1">{testCase.name}</div>
              </div>
            </div>
              {/* Defectos seleccionados */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-500">Defectos Vinculados</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 hover:bg-green-50 hover:text-green-600"
                    onClick={() => setIsNewDefectFormOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Nuevo Defecto
                  </Button>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100">
                    {selectedDefects.length} {selectedDefects.length === 1 ? 'defecto' : 'defectos'}
                  </span>
                </div>
              </div>
              
              {selectedDefects.length === 0 ? (
                <div className="flex items-center justify-center p-6 bg-gray-50 border border-dashed border-gray-300 rounded-md text-gray-500 italic">
                  No hay defectos vinculados
                </div>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {selectedDefects.map(defectId => {
                    const incident = incidents.find(inc => inc.id === defectId);
                    return (
                      <div 
                        key={defectId} 
                        className={`flex items-center justify-between p-3 rounded-md border shadow-sm ${
                          incident?.prioridad === 'Alta' ? 'bg-red-50 border-red-200' :
                          incident?.prioridad === 'Media' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="font-medium">{defectId}</div>
                          {incident && (
                            <div className="text-sm text-gray-700 truncate max-w-[450px]">
                              {incident.descripcion}
                            </div>
                          )}
                          {incident?.idJira && (
                            <div className="text-xs text-gray-500 mt-1">
                              Jira: {incident.idJira}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2 h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                          onClick={() => removeDefect(defectId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
              {/* Añadir defecto manualmente */}
            <div className="space-y-2 mt-6">
              <Label className="text-sm font-medium text-gray-500">Añadir ID de Defecto Manualmente</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    className="pl-3 pr-3 py-2 h-10 text-base"
                    placeholder="Ej: INC-20250511-001, SRCA-1234"
                    value={newDefect}
                    onChange={(e) => setNewDefect(e.target.value)}
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleAddCustomDefect} 
                  disabled={!newDefect.trim()}
                  className="gap-2 h-10"
                >
                  <PlusCircle className="h-4 w-4" />
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
          
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
