'use client';

import { useState, useEffect } from 'react';
import { Incident } from '@/models/Incident';
import { QAAnalyst } from '@/models/QAAnalyst';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import AsyncSelect from 'react-select/async';
import { useJiraIdSuggestions, JiraOption } from '@/hooks/useJiraIdSuggestions';
import "./styles.css";

interface IncidentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (incident: Partial<Incident>) => Promise<void>;
    incident?: Incident;
}

export function IncidentForm({ isOpen, onClose, onSubmit, incident }: IncidentFormProps) {
    const [formData, setFormData] = useState<Partial<Incident>>(incident || {
        celula: '',
        estado: 'Abierto',
        prioridad: '',
        descripcion: '',
        fechaCreacion: new Date(),
        informadoPor: '',
        asignadoA: '',
        diasAbierto: 0,
        esErroneo: false,
        aplica: false,
        cliente: '',
        idJira: ''
    });

    const [analysts, setAnalysts] = useState<QAAnalyst[]>([]);
    const { searchJiraIds, loading } = useJiraIdSuggestions();
    const [error, setError] = useState<string>('');

    useEffect(() => {
        // Cargar la lista de analistas al montar el componente
        fetch('/api/analysts')
            .then(response => response.json())
            .then(data => setAnalysts(data))
            .catch(error => {
                console.error('Error loading analysts:', error);
                setError('Error al cargar la lista de analistas');
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.celula || !formData.asignadoA || !formData.descripcion || !formData.cliente || !formData.prioridad) {
            setError('Por favor completa todos los campos requeridos');
            return;
        }
        setError('');
        await onSubmit({
            ...formData,
            fechaCreacion: formData.fechaCreacion || new Date(),
            diasAbierto: 0
        });
        onClose();
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
        // Limpiar el error cuando el usuario empiece a escribir
        if (error) setError('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] p-8 bg-white rounded-lg shadow-lg border border-gray-200">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-bold text-gray-700">
                        {incident ? 'Editar Incidente' : 'Nuevo Incidente'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                    </div>

                    {error && (
                        <div className="text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <DialogFooter className="mt-8 flex justify-end space-x-4">
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
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
