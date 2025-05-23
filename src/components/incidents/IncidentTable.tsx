'use client';

import { useState, useCallback, useMemo } from 'react';
import { Incident } from '@/models/Incident';
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
import { MetricsDashboard } from './MetricsDashboard';
import { ExportExcelButton } from './ExportExcelButton';
import { 
    useIncidents, 
    useIncidentStats, 
    createIncident, 
    updateIncident, 
    deleteIncident,
    changeIncidentStatus 
} from '@/hooks/useIncidents';

// Definir tipos para el ordenamiento
type SortField = keyof Pick<Incident, 'id' | 'descripcion' | 'estado' | 'prioridad' | 'fechaCreacion' | 'cliente'>;
type SortDirection = 'asc' | 'desc';

export function IncidentTable() {    // Usar los hooks personalizados con SWR
    const { incidents, isLoading, isError } = useIncidents();
    const { stats } = useIncidentStats();
    
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
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Ordenamiento
    const [sortField, setSortField] = useState<SortField>('fechaCreacion');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    
    // Función para manejar el ordenamiento
    const handleSort = useCallback((field: SortField) => {
        setSortField(prevField => {
            if (prevField === field) {
                // Si hacemos clic en el mismo campo, invertir dirección
                setSortDirection(prevDir => prevDir === 'asc' ? 'desc' : 'asc');
                return prevField;
            } else {
                // Si cambiamos de campo, establecer el nuevo campo y dirección ascendente
                setSortDirection('asc');
                return field;
            }
        });
    }, []);    // Renderizar ícono de ordenamiento
    const renderSortIcon = useCallback((field: SortField) => {
        if (sortField !== field) {
            return <span className="text-gray-400 ml-1">↕</span>;
        }
        return sortDirection === 'asc' 
            ? <span className="text-blue-600 ml-1">↑</span> 
            : <span className="text-blue-600 ml-1">↓</span>;
    }, [sortField, sortDirection]);
    
    // Manejar eliminación de incidente con confirmación
    const handleConfirmDelete = useCallback(async () => {
        if (!incidentToDelete) return;
        
        await deleteIncident(incidentToDelete);
        setIncidentToDelete(null);
        setIsConfirmOpen(false);
    }, [incidentToDelete]);
      // Manejar envío del formulario
    const handleSubmit = useCallback(async (incident: Partial<Incident>) => {
        if (selectedIncident) {
            await updateIncident(selectedIncident.id, incident);
        } else {
            // Convertir a IncidentFormData para la creación
            const incidentData = {
                celula: incident.celula || '',
                estado: incident.estado || 'Abierto',
                prioridad: incident.prioridad || 'Media',
                descripcion: incident.descripcion || '',
                fechaReporte: incident.fechaReporte || new Date(),
                informadoPor: incident.informadoPor || '',
                asignadoA: incident.asignadoA || '',
                cliente: incident.cliente || '',
                idJira: incident.idJira || '',
                fechaCreacion: incident.fechaCreacion,
                fechaSolucion: incident.fechaSolucion,
                tipoBug: incident.tipoBug,
                areaAfectada: incident.areaAfectada,
                etiquetas: incident.etiquetas,
                esErroneo: incident.esErroneo,
                aplica: incident.aplica
            };
            await createIncident(incidentData);
        }
        setIsFormOpen(false);
        setSelectedIncident(undefined);
    }, [selectedIncident]);

    // Helpers
    const getStatusColor = useCallback((estado: string) => {
        switch (estado) {
            case 'Abierto': return 'bg-red-100 text-red-800';
            case 'En Progreso': return 'bg-yellow-100 text-yellow-800';
            case 'Resuelto': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }, []);

    const truncateText = useCallback((text: string, maxLength: number = 50) => {
        if (!text) return '';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    }, []);
    
    // Datos filtrados y ordenados
    const filteredAndSortedIncidents = useMemo(() => {
        if (!incidents || incidents.length === 0) return [];
        
        // Primero filtramos
        const filtered = incidents.filter(incident => {
            const matchesSearch = (
                (incident.descripcion || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (incident.informadoPor || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (incident.asignadoA || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (incident.id || '').toLowerCase().includes(filters.search.toLowerCase())
            );

            const matchesEstado = !filters.estado || incident.estado === filters.estado;
            const matchesPrioridad = !filters.prioridad || incident.prioridad === filters.prioridad;
            const matchesCliente = !filters.cliente || incident.cliente === filters.cliente;

            return matchesSearch && matchesEstado && matchesPrioridad && matchesCliente;
        });
        
        // Luego ordenamos
        return [...filtered].sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];
            
            if (sortField === 'fechaCreacion') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
                return sortDirection === 'asc' 
                    ? aValue.getTime() - bValue.getTime()
                    : bValue.getTime() - aValue.getTime();
            }
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortDirection === 'asc' ? comparison : -comparison;
            }
            
            return 0;
        });
    }, [incidents, filters, sortField, sortDirection]);
    
    // Lógica de paginación
    const paginationInfo = useMemo(() => {
        const totalPages = Math.ceil(filteredAndSortedIncidents.length / itemsPerPage);
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredAndSortedIncidents.slice(indexOfFirstItem, indexOfLastItem);
        
        return { 
            totalPages, 
            indexOfLastItem, 
            indexOfFirstItem, 
            currentItems 
        };
    }, [filteredAndSortedIncidents, currentPage, itemsPerPage]);
    
    // Clientes únicos para el filtro
    const uniqueClients = useMemo(() => {
        if (!incidents) return [];
        const clientSet = new Set(incidents.map(i => i.cliente).filter(Boolean));
        return Array.from(clientSet);
    }, [incidents]);    return (
        <div>            <div className="flex justify-between items-center mb-4">
                <Button
                    data-test-id="new-incident-btn"
                    onClick={() => {
                        setSelectedIncident(undefined);
                        setIsFormOpen(true);
                    }}
                >
                    Nuevo Incidente
                </Button>
                <ExportExcelButton className="shadow-sm hover:shadow-md transition-shadow" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                    {uniqueClients.map(cliente => (
                        <option key={cliente} value={cliente}>{cliente}</option>
                    ))}
                </Select>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-md" />
                    ))}
                </div>
            ) : isError ? (
                <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No se pudieron cargar los incidentes. Por favor, intente de nuevo.
                    </h3>
                    <Button onClick={() => window.location.reload()}>
                        Intentar de nuevo
                    </Button>
                </div>
            ) : filteredAndSortedIncidents.length === 0 ? (
                <div className="text-center p-8 rounded-lg border border-dashed">
                    {filters.search || filters.estado || filters.prioridad || filters.cliente ? (
                        <p className="text-gray-500">No se encontraron incidentes que coincidan con su búsqueda</p>
                    ) : (
                        <>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay incidentes registrados</h3>
                            <p className="text-gray-500 mb-4">Comience creando un nuevo incidente</p>
                            <Button
                                onClick={() => {
                                    setSelectedIncident(undefined);
                                    setIsFormOpen(true);
                                }}
                            >
                                Nuevo Incidente
                            </Button>
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="rounded-md border mb-4">
                        <Table>
                            <TableHeader>                                <TableRow>
                                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('id')}>
                                        <div className="flex items-center">
                                            ID {renderSortIcon('id')}
                                        </div>
                                    </TableHead>
                                    <TableHead>Célula</TableHead>
                                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('estado')}>
                                        <div className="flex items-center">
                                            Estado {renderSortIcon('estado')}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('prioridad')}>
                                        <div className="flex items-center">
                                            Prioridad {renderSortIcon('prioridad')}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-gray-50 w-[250px]" onClick={() => handleSort('descripcion')}>
                                        <div className="flex items-center">
                                            Descripción {renderSortIcon('descripcion')}
                                        </div>
                                    </TableHead>
                                    <TableHead>Asignado a</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginationInfo.currentItems.map((incident: Incident) => (
                                    <TableRow key={incident.id} className="cursor-pointer hover:bg-gray-50">                                        <TableCell
                                            className="font-medium"
                                            onClick={() => {
                                                setIncidentToView(incident);
                                                setIsDetailsDialogOpen(true);
                                            }}
                                        >
                                            {incident.id}
                                        </TableCell>                                        <TableCell>
                                            {incident.celula}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.estado)}`}>
                                                {incident.estado}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                incident.prioridad === 'Alta' ? 'bg-red-100 text-red-800' :
                                                incident.prioridad === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {incident.prioridad}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div 
                                                className="cursor-pointer hover:text-blue-600"
                                                onClick={() => {
                                                    setIncidentToView(incident);
                                                    setIsDetailsDialogOpen(true);
                                                }}
                                            >
                                                {truncateText(incident.descripcion, 40)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{incident.asignadoA}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedIncident(incident);
                                                    setIsFormOpen(true);
                                                }}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIncidentToChangeStatus(incident);
                                                    setIsStatusDialogOpen(true);
                                                }}
                                            >
                                                Estado
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIncidentToDelete(incident.id);
                                                    setIsConfirmOpen(true);
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                Eliminar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    
                    {/* Controles de paginación */}
                    {paginationInfo.totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 mb-8">
                            <div className="text-sm text-muted-foreground">
                                Mostrando {paginationInfo.indexOfFirstItem + 1}-
                                {Math.min(paginationInfo.indexOfLastItem, filteredAndSortedIncidents.length)} de {filteredAndSortedIncidents.length} incidentes
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                >
                                    Anterior
                                </Button>
                                
                                <div className="flex items-center space-x-1">
                                    {[...Array(Math.min(paginationInfo.totalPages, 5))].map((_, idx) => {
                                        // Lógica para mostrar números de página alrededor de la página actual
                                        let pageNumber;
                                        if (paginationInfo.totalPages <= 5) {
                                            pageNumber = idx + 1;
                                        } else if (currentPage <= 3) {
                                            pageNumber = idx + 1;
                                        } else if (currentPage >= paginationInfo.totalPages - 2) {
                                            pageNumber = paginationInfo.totalPages - 4 + idx;
                                        } else {
                                            pageNumber = currentPage - 2 + idx;
                                        }
                                        
                                        return (
                                            <Button 
                                                key={idx}
                                                variant={currentPage === pageNumber ? "default" : "outline"}
                                                size="sm"
                                                className="w-8"
                                                onClick={() => setCurrentPage(pageNumber)}
                                            >
                                                {pageNumber}
                                            </Button>
                                        );
                                    })}
                                </div>
                                
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={currentPage === paginationInfo.totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(paginationInfo.totalPages, p + 1))}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-8">
                        <StatsView stats={stats} />
                        <MetricsDashboard incidents={incidents} />
                    </div>
                </>
            )}

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

            {incidentToChangeStatus && (                <ChangeStatusDialog
                    isOpen={isStatusDialogOpen}
                    onClose={() => {
                        setIsStatusDialogOpen(false);
                        setIncidentToChangeStatus(null);
                    }}                    onSubmit={async (incident: any) => {
                        if (incidentToChangeStatus) {
                            // Usar la función específica para cambio de estado
                            await changeIncidentStatus(
                                incidentToChangeStatus.id, 
                                incident.estado || incidentToChangeStatus.estado,
                                incident.comentario
                            );
                            setIsStatusDialogOpen(false);
                            setIncidentToChangeStatus(null);
                        }
                    }}
                    incident={incidentToChangeStatus}
                />
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Eliminar Incidente"
                message="¿Estás seguro de que deseas eliminar este incidente? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setIncidentToDelete(null);
                }}
            />
        </div>
    );
}
