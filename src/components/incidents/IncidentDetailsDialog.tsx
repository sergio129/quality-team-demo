'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Incident } from '@/models/Incident';

interface IncidentDetailsDialogProps {
    incident: Incident | null;
    isOpen: boolean;
    onClose: () => void;
}

export function IncidentDetailsDialog({ incident, isOpen, onClose }: IncidentDetailsDialogProps) {
    if (!incident) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Detalles del Incidente</DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold">ID</h4>
                            <p>{incident.id}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">ID de JIRA</h4>
                            <p>{incident.idJira || '-'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Célula</h4>
                            <p>{incident.celula}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Cliente</h4>
                            <p>{incident.cliente}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Estado</h4>
                            <p>{incident.estado}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Prioridad</h4>
                            <p>{incident.prioridad}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Informado por</h4>
                            <p>{incident.informadoPor}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Asignado a</h4>
                            <p>{incident.asignadoA}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Fecha de Creación</h4>
                            <p>{new Date(incident.fechaCreacion).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Fecha de Solución</h4>
                            <p>{incident.fechaSolucion ? new Date(incident.fechaSolucion).toLocaleDateString() : '-'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Días Abierto</h4>
                            <p>{incident.diasAbierto}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Estado</h4>
                            <div className="flex gap-4">
                                <p>Erróneo: {incident.esErroneo ? 'Sí' : 'No'}</p>
                                <p>Aplica: {incident.aplica ? 'Sí' : 'No'}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold">Descripción</h4>
                        <p className="whitespace-pre-wrap">{incident.descripcion}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
