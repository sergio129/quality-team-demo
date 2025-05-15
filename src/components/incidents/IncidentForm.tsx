'use client';

import { useState, useEffect } from 'react';
import { Incident } from '@/models/Incident';
import { QAAnalyst } from '@/models/QAAnalyst';
import { Cell } from '@/models/Cell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface IncidentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (incident: Partial<Incident>) => Promise<void>;
    incident?: Incident;
}

export function IncidentForm({ isOpen, onClose, onSubmit, incident }: IncidentFormProps) {
    const [formData, setFormData] = useState<Partial<Incident>>(
        incident || {
            celula: '',
            estado: 'Abierto',
            prioridad: 'Media',
            descripcion: '',
            informadoPor: '',
            asignadoA: '',
            cliente: '',
            esErroneo: false,
            aplica: true
        }
    );
    
    const [cells, setCells] = useState<Cell[]>([]);
    const [analysts, setAnalysts] = useState<QAAnalyst[]>([]);

    useEffect(() => {
        // Cargar células
        fetch('/api/cells')
            .then(response => response.json())
            .then(data => setCells(data))
            .catch(error => console.error('Error loading cells:', error));

        // Cargar analistas
        fetch('/api/analysts')
            .then(response => response.json())
            .then(data => setAnalysts(data))
            .catch(error => console.error('Error loading analysts:', error));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {incident ? 'Editar Incidente' : 'Nuevo Incidente'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">                    <div>
                        <Label htmlFor="celula">Célula</Label>
                        <Select
                            id="celula"
                            name="celula"
                            value={formData.celula}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Seleccionar célula</option>
                            {cells.map(cell => (
                                <option key={cell.id} value={cell.name}>
                                    {cell.name}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="estado">Estado</Label>
                        <Select
                            id="estado"
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            required
                        >
                            <option value="Abierto">Abierto</option>
                            <option value="En Progreso">En Progreso</option>
                            <option value="Resuelto">Resuelto</option>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="prioridad">Prioridad</Label>
                        <Select
                            id="prioridad"
                            name="prioridad"
                            value={formData.prioridad}
                            onChange={handleChange}
                            required
                        >
                            <option value="Alta">Alta</option>
                            <option value="Media">Media</option>
                            <option value="Baja">Baja</option>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                            id="descripcion"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            required
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label htmlFor="cliente">Cliente</Label>
                        <Input
                            id="cliente"
                            name="cliente"
                            value={formData.cliente}
                            onChange={handleChange}
                            required
                        />
                    </div>                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="informadoPor">Informado por</Label>
                            <Select
                                id="informadoPor"
                                name="informadoPor"
                                value={formData.informadoPor}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Seleccionar analista</option>
                                {analysts.map(analyst => (
                                    <option key={analyst.id} value={analyst.name}>
                                        {analyst.name}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="asignadoA">Asignado a</Label>
                            <Select
                                id="asignadoA"
                                name="asignadoA"
                                value={formData.asignadoA}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Seleccionar analista</option>
                                {analysts.map(analyst => (
                                    <option key={analyst.id} value={analyst.name}>
                                        {analyst.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="esErroneo"
                                checked={formData.esErroneo}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                            <span>Es erróneo</span>
                        </label>

                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="aplica"
                                checked={formData.aplica}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                            <span>Aplica</span>
                        </label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {incident ? 'Guardar Cambios' : 'Crear Incidente'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
