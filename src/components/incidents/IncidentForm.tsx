'use client';

import { useState, useEffect } from 'react';
import { Incident, BugType, AreaAfectada, StateChange } from '@/models/Incident';
import { QAAnalyst } from '@/models/QAAnalyst';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import AsyncSelect from 'react-select/async';
import { useJiraIdSuggestions, JiraOption } from '@/hooks/useJiraIdSuggestions';
import IncidentImageUploader from './IncidentImageUploader';
import FileUploader, { TempFileItem } from './FileUploader';
import "./styles.css";

interface IncidentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (incident: Partial<Incident>) => Promise<void>;
    incident?: Incident;
}

export function IncidentForm({ isOpen, onClose, onSubmit, incident }: IncidentFormProps) {
    const [formData, setFormData] = useState<Partial<Incident>>({
        celula: '',
        estado: 'Abierto',
        prioridad: 'Media',
        descripcion: '',
        fechaCreacion: new Date(),
        fechaReporte: new Date(), // Inicializamos la fecha de reporte por defecto con la fecha actual
        informadoPor: '',
        asignadoA: '',
        diasAbierto: 0,
        esErroneo: false,
        aplica: false,
        cliente: '',
        idJira: '',
        tipoBug: undefined,
        areaAfectada: undefined,
        etiquetas: [],
        historialEstados: []
    });
    
    const [incidentSaved, setIncidentSaved] = useState(false);
    const [tempFiles, setTempFiles] = useState<TempFileItem[]>([]);

    useEffect(() => {
        if (incident) {
            setFormData(incident);
        }
    }, [incident]);

    const [analysts, setAnalysts] = useState<QAAnalyst[]>([]);
    const { searchJiraIds, loading } = useJiraIdSuggestions();
    const [error, setError] = useState<string>('');
    const [etiqueta, setEtiqueta] = useState('');

    useEffect(() => {
        fetch('/api/analysts')
            .then(response => response.json())
            .then(data => setAnalysts(data))
            .catch(error => {
                console.error('Error loading analysts:', error);
                setError('Error al cargar la lista de analistas');
            });
    }, []);    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.celula || !formData.asignadoA || !formData.descripcion || !formData.cliente || !formData.prioridad || !formData.fechaReporte) {
            setError('Por favor completa todos los campos requeridos');
            return;
        }
        setError('');
        try {
            // Guardar el incidente
            const result = await onSubmit({
                ...formData,
                fechaCreacion: formData.fechaCreacion || new Date(),
                fechaReporte: formData.fechaReporte || new Date(),
                diasAbierto: formData.diasAbierto || 0
            });
            
            // Si se ha creado un nuevo incidente y hay archivos temporales, subirlos
            if (result && result.id && tempFiles.length > 0) {
                toast.info(`Subiendo ${tempFiles.length} archivos...`);
                await uploadTempFiles(result.id);
                toast.success(`Se han subido ${tempFiles.length} archivos correctamente`);
            }
            
            setIncidentSaved(true);
            onClose();
        } catch (error) {
            console.error('Error al guardar el incidente:', error);
            setError('Error al guardar el incidente');
        }
    };

    const handleChange = (e: any) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,            [name]: type === 'checkbox' ? e.target.checked : value,
            ...(name === 'estado' && value !== prev.estado ? {
                historialEstados: [
                    ...(prev.historialEstados || []),
                    { estado: value, fecha: new Date() }
                ],
                ...(value === 'Resuelto' ? { fechaSolucion: new Date() } : {})
            } : {})
        }));
    };

    const handleAddEtiqueta = () => {
        if (etiqueta && !formData.etiquetas?.includes(etiqueta)) {
            setFormData(prev => ({
                ...prev,
                etiquetas: [...(prev.etiquetas || []), etiqueta]
            }));
            setEtiqueta('');
        }
    };

    const handleRemoveEtiqueta = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            etiquetas: prev.etiquetas?.filter(t => t !== tag)
        }));
    };

    // Funciones para manejar archivos temporales
    const handleAddTempFile = (file: TempFileItem) => {
        setTempFiles(prev => [...prev, file]);
    };

    const handleRemoveTempFile = (fileId: string) => {
        setTempFiles(prev => prev.filter(file => file.id !== fileId));
    };

    // Función para subir archivos temporales después de que se crea el incidente
    const uploadTempFiles = async (incidentId: string) => {
        if (tempFiles.length === 0) return;
        
        const uploadPromises = tempFiles.map(async (tempFile) => {
            const formData = new FormData();
            formData.append('incidentId', incidentId);
            formData.append('file', tempFile.file);
            
            try {
                const response = await fetch('/api/incidents/upload-file', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`Error al subir el archivo ${tempFile.fileName}`);
                }
                
                return response.json();
            } catch (error) {
                console.error(`Error al subir el archivo ${tempFile.fileName}:`, error);
                return null;
            }
        });
        
        try {
            await Promise.all(uploadPromises);
            console.log(`Se han subido ${tempFiles.length} archivos al incidente ${incidentId}`);
        } catch (error) {
            console.error('Error al subir archivos temporales:', error);
        }
    };

    const handleSaveIncident = async () => {
        // Lógica para guardar el incidente
        // ...
        // Después de guardar el incidente, subir los archivos temporales
        if (incidentSaved && incident?.id) {
            await uploadTempFiles(incident.id);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] h-[90vh] flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <DialogHeader className="py-4 px-6 border-b border-gray-200 flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold text-gray-700">
                        {incident ? 'Editar Incidente' : 'Nuevo Incidente'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="idJira" className="text-sm font-medium text-gray-600 mb-2">
                                    ID de JIRA
                                </Label>
                                <AsyncSelect<JiraOption>
                                    inputId="idJira"
                                    cacheOptions
                                    defaultOptions
                                    value={formData.idJira ? { value: formData.idJira, label: formData.idJira } : null}
                                    loadOptions={searchJiraIds}
                                    onChange={(option) => 
                                        setFormData(prev => ({ ...prev, idJira: option?.value || '' }))
                                    }
                                    placeholder="Buscar ID de JIRA..."
                                    classNamePrefix="react-select"
                                    isLoading={loading}
                                    noOptionsMessage={() => "No se encontraron resultados"}
                                    loadingMessage={() => "Buscando..."}
                                    isClearable
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            minHeight: '42px',
                                            backgroundColor: 'white',
                                            borderColor: '#d1d5db',
                                            borderRadius: '0.375rem',
                                            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                            '&:hover': {
                                                borderColor: '#9ca3af'
                                            },
                                            '&:focus-within': {
                                                borderColor: '#2563eb',
                                                boxShadow: '0 0 0 1px #2563eb'
                                            }
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            backgroundColor: 'white',
                                            zIndex: 50,
                                            borderRadius: '0.375rem',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#bfdbfe' : 'white',
                                            color: state.isSelected ? 'white' : '#374151',
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            '&:active': {
                                                backgroundColor: state.isSelected ? '#2563eb' : '#93c5fd'
                                            }
                                        }) as any,
                                        singleValue: (base) => ({
                                            ...base,
                                            color: '#374151'
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: '#9ca3af'
                                        })
                                    }}
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="celula" className="text-sm font-medium text-gray-600 mb-2">
                                        Célula *
                                    </Label>
                                    <Select
                                        id="celula"
                                        name="celula"
                                        value={formData.celula}
                                        onChange={handleChange}
                                        required
                                        className="w-full mt-1 bg-white border-gray-300"
                                    >
                                        <option value="">Seleccionar célula...</option>
                                        <option value="Servicio Virtuales">Servicio Virtuales</option>
                                        <option value="KCRM">KCRM</option>
                                        <option value="Suramericana">Suramericana</option>
                                        <option value="Comdata">Comdata</option>
                                        <option value="IVR">IVR</option>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="cliente" className="text-sm font-medium text-gray-600 mb-2">
                                        Cliente *
                                    </Label>
                                    <Input
                                        type="text"
                                        id="cliente"
                                        name="cliente"
                                        value={formData.cliente}
                                        onChange={handleChange}
                                        required
                                        className="w-full mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="fechaReporte" className="text-sm font-medium text-gray-600 mb-2">
                                        Fecha de Reporte *
                                    </Label>
                                    <Input
                                        type="date"
                                        id="fechaReporte"
                                        name="fechaReporte"
                                        value={formData.fechaReporte ? new Date(formData.fechaReporte).toISOString().split('T')[0] : ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full mt-1"
                                    />
                                </div>
                                <div>
                                    {/* Espacio para balancear la grid */}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="informadoPor" className="text-sm font-medium text-gray-600 mb-2">
                                        Informado por *
                                    </Label>
                                    <Select
                                        id="informadoPor"
                                        name="informadoPor"
                                        value={formData.informadoPor}
                                        onChange={handleChange}
                                        required
                                        className="w-full mt-1 bg-white border-gray-300"
                                    >
                                        <option value="">Seleccionar analista...</option>
                                        {analysts.map((analyst) => (
                                            <option key={analyst.id} value={analyst.name}>
                                                {analyst.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="asignadoA" className="text-sm font-medium text-gray-600 mb-2">
                                        Asignado a *
                                    </Label>
                                    <Input
                                        type="text"
                                        id="asignadoA"
                                        name="asignadoA"
                                        value={formData.asignadoA}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nombre del responsable"
                                        className="w-full mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="descripcion" className="text-sm font-medium text-gray-600 mb-2">
                                    Descripción *
                                </Label>
                                <Textarea
                                    id="descripcion"
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    required
                                    rows={3}
                                    className="w-full mt-1 resize-none bg-white border-gray-300"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="estado" className="text-sm font-medium text-gray-600 mb-2">
                                        Estado *
                                    </Label>
                                    <Select
                                        id="estado"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                        required
                                        className="w-full mt-1 bg-white border-gray-300"
                                    >
                                        <option value="Abierto">Abierto</option>
                                        <option value="En Progreso">En Progreso</option>
                                        <option value="Resuelto">Resuelto</option>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="prioridad" className="text-sm font-medium text-gray-600 mb-2">
                                        Prioridad *
                                    </Label>
                                    <Select
                                        id="prioridad"
                                        name="prioridad"
                                        value={formData.prioridad}
                                        onChange={handleChange}
                                        required
                                        className="w-full mt-1 bg-white border-gray-300"
                                    >
                                        <option value="">Seleccionar prioridad...</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Media">Media</option>
                                        <option value="Baja">Baja</option>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="tipoBug" className="text-sm font-medium text-gray-600 mb-2">
                                        Tipo de Bug
                                    </Label>
                                    <Select
                                        id="tipoBug"
                                        name="tipoBug"
                                        value={formData.tipoBug || ''}
                                        onChange={handleChange}
                                        className="w-full mt-1 bg-white border-gray-300"
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

                                <div>
                                    <Label htmlFor="areaAfectada" className="text-sm font-medium text-gray-600 mb-2">
                                        Área Afectada
                                    </Label>
                                    <Select
                                        id="areaAfectada"
                                        name="areaAfectada"
                                        value={formData.areaAfectada || ''}
                                        onChange={handleChange}
                                        className="w-full mt-1 bg-white border-gray-300"
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
                            </div>                            {formData.historialEstados && formData.historialEstados.length > 0 && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-600 mb-2">
                                        Historial de Estados
                                    </Label>
                                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto bg-gray-50 rounded-md p-3">
                                        {formData.historialEstados.map((cambio, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span className="text-gray-700">{cambio.estado}</span>
                                                <span className="text-gray-500">
                                                    {new Date(cambio.fecha).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label htmlFor="etiquetas" className="text-sm font-medium text-gray-600 mb-2">
                                    Etiquetas
                                </Label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        type="text"
                                        id="etiquetas"
                                        value={etiqueta}
                                        onChange={(e) => setEtiqueta(e.target.value)}
                                        className="flex-1"
                                        placeholder="Agregar etiqueta..."
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddEtiqueta}
                                        variant="outline"
                                    >
                                        Agregar
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.etiquetas?.map((tag) => (
                                        <span
                                            key={tag}
                                            className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveEtiqueta(tag)}
                                                className="ml-1 text-blue-600 hover:text-blue-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex space-x-6">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="esErroneo"
                                        checked={formData.esErroneo}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <Label htmlFor="esErroneo" className="ml-2 text-sm text-gray-600">
                                        Marcado como erróneo
                                    </Label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="aplica"
                                        checked={formData.aplica}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <Label htmlFor="aplica" className="ml-2 text-sm text-gray-600">
                                        Aplica
                                    </Label>
                                </div>
                            </div>
                              {incident && incident.id && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-600 mb-2">
                                        Archivos del Incidente
                                    </Label>
                                    <div className="mt-2">
                                        <IncidentImageUploader 
                                            incidentId={incident.id} 
                                            readOnly={false} 
                                        />
                                    </div>
                                </div>
                            )}
                              {!incident && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-600 mb-2">
                                        Archivos adjuntos
                                    </Label>
                                    <div className="mt-2">
                                        <FileUploader
                                            files={tempFiles}
                                            onFileAdd={handleAddTempFile}
                                            onFileRemove={handleRemoveTempFile}
                                            readOnly={false}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                        {error && (
                            <div className="text-sm text-red-600 mb-4">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {incident ? 'Guardar Cambios' : 'Crear Incidente'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
