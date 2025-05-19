'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Incident } from '@/models/Incident';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

type EstadoType = 'Abierto' | 'En Progreso' | 'Resuelto';

interface ChangeStatusDialogProps {
    incident: Incident | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (incident: Partial<Incident>) => Promise<void>;
}

export function ChangeStatusDialog({ incident, isOpen, onClose, onSubmit }: ChangeStatusDialogProps) {
    const [estado, setEstado] = useState<EstadoType>((incident?.estado as EstadoType) || 'Abierto');
    const [fechaSolucion, setFechaSolucion] = useState(
        incident?.fechaSolucion ? new Date(incident.fechaSolucion).toISOString().split('T')[0] : ''
    );
    const [comentario, setComentario] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cuando el diálogo se abre, reiniciamos los valores basados en el incidente actual
    useEffect(() => {
        if (incident && isOpen) {
            setEstado((incident.estado as EstadoType) || 'Abierto');
            setFechaSolucion(
                incident.fechaSolucion ? new Date(incident.fechaSolucion).toISOString().split('T')[0] : ''
            );
            setComentario('');
        }
    }, [incident, isOpen]);const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (estado === 'Resuelto' && !fechaSolucion) {
            toast.error('Por favor seleccione la fecha de solución');
            return;
        }

        if (!incident) {
            toast.error('No se puede actualizar el estado de un incidente inexistente');
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Preparamos los datos para actualizar
            const updatedIncident: Partial<Incident> = {
                estado,
                fechaSolucion: estado === 'Resuelto' ? new Date(fechaSolucion) : undefined,
            };
            
            // Pasamos el comentario como una propiedad adicional al incidente (aunque no sea parte del tipo Incident directamente)
            const incidentWithComment = {
                ...updatedIncident,
                comentario: comentario.trim() || undefined
            };
            
            // @ts-ignore - Ignoramos el error de TypeScript ya que sabemos que estamos agregando una propiedad adicional
            await onSubmit(incidentWithComment);
            onClose();
        } catch (error) {
            toast.error('Error al actualizar el estado del incidente');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
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
                    </div>                    {estado === 'Resuelto' && (
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

                    <div className="mt-4">
                        <Label htmlFor="comentario">Comentario</Label>
                        <Textarea
                            id="comentario"
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            placeholder="Añade un comentario sobre este cambio de estado..."
                            className="w-full mt-2"
                            rows={3}
                        />
                    </div>                    <DialogFooter className="mt-6">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onClose} 
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Guardando...
                                </>
                            ) : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
