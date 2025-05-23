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
            <DialogContent className="sm:max-w-[700px] h-auto bg-white rounded-lg shadow-lg">
                <DialogHeader className="pb-4 border-b border-gray-200">
                    <DialogTitle className="text-xl font-semibold text-gray-900">Detalles del Incidente</DialogTitle>
                </DialogHeader>
                <div className="mt-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto p-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">ID</h4>
                            <p className="text-gray-900">{incident.id}</p>
                        </div>                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">ID de JIRA</h4>
                            <p className="text-gray-900">{incident.idJira || '-'}</p>
                        </div>                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Célula</h4>
                            <p className="text-gray-900">{incident.celula}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Cliente</h4>
                            <p className="text-gray-900">{incident.cliente}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Tipo de Bug</h4>
                            <p className="text-gray-900">{incident.tipoBug || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Área Afectada</h4>
                            <p className="text-gray-900">{incident.areaAfectada || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Estado</h4>
                            <p className="text-gray-900">{incident.estado}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Prioridad</h4>
                            <p className="text-gray-900">{incident.prioridad}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Informado por</h4>
                            <p className="text-gray-900">{incident.informadoPor}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Asignado a</h4>
                            <p className="text-gray-900">{incident.asignadoA}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Fecha de Creación</h4>
                            <p className="text-gray-900">{new Date(incident.fechaCreacion).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Fecha de Reporte</h4>
                            <p className="text-gray-900">{incident.fechaReporte ? new Date(incident.fechaReporte).toLocaleDateString() : '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Fecha de Solución</h4>
                            <p className="text-gray-900">{incident.fechaSolucion ? new Date(incident.fechaSolucion).toLocaleDateString() : '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-600">Días Abierto</h4>
                            <p className="text-gray-900">{incident.diasAbierto}</p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-600">Descripción</h4>
                        <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">{incident.descripcion}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-600">Estado del Incidente</h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                            <div>
                                <span className="text-sm text-gray-600">Erróneo:</span>
                                <span className="ml-2 font-medium text-gray-900">{incident.esErroneo ? 'Sí' : 'No'}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Aplica:</span>
                                <span className="ml-2 font-medium text-gray-900">{incident.aplica ? 'Sí' : 'No'}</span>
                            </div>
                        </div>
                    </div>

                    {incident.historialEstados && incident.historialEstados.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-600">Historial de Estados</h4>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                {incident.historialEstados.map((cambio, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            <span className="text-gray-900">{cambio.estado}</span>
                                        </div>
                                        <span className="text-gray-500">
                                            {new Date(cambio.fecha).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
