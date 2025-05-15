'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Incident } from '@/models/Incident';
import { useState } from 'react';

type EstadoType = 'Abierto' | 'En Progreso' | 'Resuelto';

interface ChangeStatusDialogProps {
    incident: Incident;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (incident: Partial<Incident>) => Promise<void>;
}

export function ChangeStatusDialog({ incident, isOpen, onClose, onSubmit }: ChangeStatusDialogProps) {
    const [estado, setEstado] = useState<EstadoType>(incident.estado as EstadoType);
    const [fechaSolucion, setFechaSolucion] = useState(
        incident.fechaSolucion ? new Date(incident.fechaSolucion).toISOString().split('T')[0] : ''
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (estado === 'Resuelto' && !fechaSolucion) {
            alert('Por favor seleccione la fecha de solución');
            return;
        }

        await onSubmit({
            ...incident,
            estado,
            fechaSolucion: estado === 'Resuelto' ? new Date(fechaSolucion) : undefined
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Cambiar Estado del Incidente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="mt-4">
                        <Label htmlFor="estado">Estado</Label>
                        <Select
                            id="estado"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value as EstadoType)}
                            className="w-full mt-2"
                        >
                            <option value="Abierto">Abierto</option>
                            <option value="En Progreso">En Progreso</option>
                            <option value="Resuelto">Resuelto</option>
                        </Select>
                    </div>

                    {estado === 'Resuelto' && (
                        <div className="mt-4">
                            <Label htmlFor="fechaSolucion">Fecha de Solución</Label>
                            <Input
                                id="fechaSolucion"
                                type="date"
                                value={fechaSolucion}
                                onChange={(e) => setFechaSolucion(e.target.value)}
                                className="w-full mt-2"
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    )}

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
