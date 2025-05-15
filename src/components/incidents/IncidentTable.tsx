'use client';

import { useState, useEffect } from 'react';
import { Incident } from '@/models/Incident';
import { IncidentStats } from '@/services/incidentService';
import { StatsView } from './StatsView';
import { IncidentForm } from './IncidentForm';
import { IncidentDetailsDialog } from './IncidentDetailsDialog';
import { ChangeStatusDialog } from './ChangeStatusDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function IncidentTable() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [stats, setStats] = useState<IncidentStats>({
        totalPorCliente: {},
        totalPorPrioridad: { Alta: 0, Media: 0, Baja: 0 },
        totalAbiertas: 0
    });
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | undefined>();
    
    // Estado para el diálogo de cambio de estado
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [incidentToChangeStatus, setIncidentToChangeStatus] = useState<Incident | null>(null);
    
    // Confirmation dialog state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
    
    // Estado para el diálogo de detalles
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [incidentToView, setIncidentToView] = useState<Incident | null>(null);

    // Filter state
    const [filters, setFilters] = useState({
        estado: '',
        prioridad: '',
        cliente: '',
        search: ''
    });

    useEffect(() => {
        fetchIncidents();
        fetchStats();
    }, []);

    const fetchIncidents = async () => {
        try {
            const response = await fetch('/api/incidents');
            const data = await response.json();
            setIncidents(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching incidents:', error);
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/incidents/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleCreateIncident = async (incident: Partial<Incident>) => {
        try {
            const response = await fetch('/api/incidents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(incident)
            });
            
            if (response.ok) {
                await fetchIncidents();
                await fetchStats();
            }
        } catch (error) {
            console.error('Error creating incident:', error);
        }
    };

    const handleUpdateIncident = async (incident: Partial<Incident>) => {
        try {
            const response = await fetch('/api/incidents', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedIncident?.id || incidentToChangeStatus?.id, 
                    incident 
                })
            });
            
            if (response.ok) {
                await fetchIncidents();
                await fetchStats();
            }
        } catch (error) {
            console.error('Error updating incident:', error);
        }
    };

    const handleDeleteIncident = async () => {
        if (!incidentToDelete) return;
        
        try {
            const response = await fetch('/api/incidents', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: incidentToDelete })
            });
            
            if (response.ok) {
                await fetchIncidents();
                await fetchStats();
            }
        } catch (error) {
            console.error('Error deleting incident:', error);
        }
        
        setIncidentToDelete(null);
        setIsConfirmOpen(false);
    };

    const handleSubmit = async (incident: Partial<Incident>) => {
        if (selectedIncident) {
            await handleUpdateIncident(incident);
        } else {
            await handleCreateIncident(incident);
        }
        setIsFormOpen(false);
        setSelectedIncident(undefined);
    };

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'Abierto': return 'bg-red-100 text-red-800';
            case 'En Progreso': return 'bg-yellow-100 text-yellow-800';
            case 'Resuelto': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    const filteredIncidents = incidents.filter(incident => {
        const matchesSearch = incident.descripcion.toLowerCase().includes(filters.search.toLowerCase()) ||
                            incident.informadoPor.toLowerCase().includes(filters.search.toLowerCase()) ||
                            incident.asignadoA.toLowerCase().includes(filters.search.toLowerCase()) ||
                            incident.id.toLowerCase().includes(filters.search.toLowerCase());

        const matchesEstado = !filters.estado || incident.estado === filters.estado;
        const matchesPrioridad = !filters.prioridad || incident.prioridad === filters.prioridad;
        const matchesCliente = !filters.cliente || incident.cliente === filters.cliente;

        return matchesSearch && matchesEstado && matchesPrioridad && matchesCliente;
    });

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold">Gestión de Incidentes</h1>
                    <StatsView stats={stats} />
                </div>
                <Button
                    onClick={() => {
                        setSelectedIncident(undefined);
                        setIsFormOpen(true);
                    }}
                >
                    Nuevo Incidente
                </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                <Input
                    placeholder="Buscar..."
                    value={filters.search}
                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
                
                <Select
                    value={filters.estado}
                    onChange={e => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                >
                    <option value="">Todos los estados</option>
                    <option value="Abierto">Abierto</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="Resuelto">Resuelto</option>
                </Select>

                <Select
                    value={filters.prioridad}
                    onChange={e => setFilters(prev => ({ ...prev, prioridad: e.target.value }))}
                >
                    <option value="">Todas las prioridades</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                </Select>

                <Select
                    value={filters.cliente}
                    onChange={e => setFilters(prev => ({ ...prev, cliente: e.target.value }))}
                >
                    <option value="">Todos los clientes</option>
                    {Object.keys(stats.totalPorCliente).map(cliente => (
                        <option key={cliente} value={cliente}>{cliente}</option>
                    ))}
                </Select>
            </div>
            
            <div className="mt-6">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Célula</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Fecha Creación</TableHead>
                                <TableHead>Informado por</TableHead>
                                <TableHead>Asignado a</TableHead>
                                <TableHead>Fecha Solución</TableHead>
                                <TableHead>Días abierto</TableHead>
                                <TableHead>Erróneo</TableHead>
                                <TableHead>Aplica</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredIncidents.map((incident) => (
                                <TableRow key={incident.id}>
                                    <TableCell>{incident.id}</TableCell>
                                    <TableCell>{incident.celula}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(incident.estado)}`}>
                                            {incident.estado}
                                        </span>
                                    </TableCell>
                                    <TableCell>{incident.prioridad}</TableCell>
                                    <TableCell>{incident.descripcion}</TableCell>
                                    <TableCell>{new Date(incident.fechaCreacion).toLocaleDateString()}</TableCell>
                                    <TableCell>{incident.informadoPor}</TableCell>
                                    <TableCell>{incident.asignadoA}</TableCell>
                                    <TableCell>
                                        {incident.fechaSolucion ? new Date(incident.fechaSolucion).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>{incident.diasAbierto}</TableCell>
                                    <TableCell>{incident.esErroneo ? 'Sí' : 'No'}</TableCell>
                                    <TableCell>{incident.aplica ? 'Sí' : 'No'}</TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="outline" 
                                            className="mr-2"
                                            onClick={() => {
                                                setIncidentToView(incident);
                                                setIsDetailsDialogOpen(true);
                                            }}
                                        >
                                            Ver
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="mr-2"
                                            onClick={() => {
                                                setSelectedIncident(incident);
                                                setIsFormOpen(true);
                                            }}
                                        >
                                            Editar
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            className="mr-2"
                                            onClick={() => {
                                                setIncidentToChangeStatus(incident);
                                                setIsStatusDialogOpen(true);
                                            }}
                                        >
                                            Cambiar Estado
                                        </Button>
                                        <Button 
                                            variant="destructive"
                                            onClick={() => {
                                                setIncidentToDelete(incident.id);
                                                setIsConfirmOpen(true);
                                            }}
                                        >
                                            Eliminar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <IncidentForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedIncident(undefined);
                }}
                onSubmit={handleSubmit}
                incident={selectedIncident}
            />

            {incidentToView && (
                <IncidentDetailsDialog
                    isOpen={isDetailsDialogOpen}
                    onClose={() => {
                        setIsDetailsDialogOpen(false);
                        setIncidentToView(null);
                    }}
                    incident={incidentToView}
                />
            )}

            {incidentToChangeStatus && (
                <ChangeStatusDialog
                    isOpen={isStatusDialogOpen}
                    onClose={() => {
                        setIsStatusDialogOpen(false);
                        setIncidentToChangeStatus(null);
                    }}
                    onSubmit={handleUpdateIncident}
                    incident={incidentToChangeStatus}
                />
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Eliminar Incidente"
                message="¿Estás seguro de que deseas eliminar este incidente? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                onConfirm={handleDeleteIncident}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setIncidentToDelete(null);
                }}
            />
        </div>
    );
}
