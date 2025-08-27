"use client";

import { Project } from '@/models/Project';
import { QAAnalyst } from '@/models/QAAnalyst';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { TimelineView } from './TimelineView/TimelineView';
import { ChevronUp, ChevronDown, ChevronsUpDown, CheckCircle, Clock, Eye, Edit, Award, Trash2 } from 'lucide-react';
import { getJiraUrl } from '@/utils/jiraUtils';
import { ChangeProjectStatusDialog } from './projects/ChangeProjectStatusDialog';
import ProjectDashboard from './projects/ProjectDashboard';
import PaginationControls from './projects/PaginationControls';
import KanbanView from './projects/KanbanView';
import ExportToExcelButton from './projects/ExportToExcelButton';
import { useProjects, useAllProjects, createProject, updateProject, deleteProject } from '@/hooks/useProjects';
import { useAnalystVacations } from '@/hooks/useAnalystVacations';
import { getWorkingDatesArray, isNonWorkingDay } from '@/utils/dateUtils';
 import { WeeklyCertificationWidget } from './projects/WeeklyCertificationWidget';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HOURS_PER_DAY = 9;

interface FormErrors {
    [key: string]: string;
}

export default function ProjectTable() {
    // Estados para filtros y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEquipo, setFilterEquipo] = useState<string>('');
    const [filterAnalista, setFilterAnalista] = useState<string>('');
    const [filterEstado, setFilterEstado] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedDateFilter, setSelectedDateFilter] = useState<'week' | 'month' | 'custom-month' | 'custom'>('month');
    const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
    
    // Hook para proyectos paginados (para vista tabla y kanban)
    const { projects, pagination, isLoading: isLoadingProjects, isError: isErrorProjects } = useProjects({
        page: currentPage,
        limit: itemsPerPage,
        searchTerm: searchTerm || undefined,
        teamFilter: filterEquipo || undefined,
        statusFilter: filterEstado || undefined,
        analystFilter: filterAnalista || undefined,
        monthFilter: selectedDateFilter === 'custom-month' ? selectedMonth : undefined,
        yearFilter: selectedDateFilter === 'custom-month' ? selectedYear : undefined
    });
    
    // Hook para TODOS los proyectos (para vista timeline - sin filtros de fecha)
    const { projects: allProjects, isLoading: isLoadingAllProjects, isError: isErrorAllProjects } = useAllProjects({
        searchTerm: searchTerm || undefined,
        teamFilter: filterEquipo || undefined,
        statusFilter: filterEstado || undefined,
        analystFilter: filterAnalista || undefined
    });
    
    // Obtener datos de vacaciones de analistas
    const { vacations, isLoading: isLoadingVacations } = useAnalystVacations();
    
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newProject, setNewProject] = useState<Partial<Project>>({});
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
    const [cells, setCells] = useState<{ id: string; name: string; teamId: string }[]>([]);
    const [analysts, setAnalysts] = useState<QAAnalyst[]>([]);
    const [filteredCells, setFilteredCells] = useState<{ id: string; name: string; teamId: string }[]>([]);
    const [activeView, setActiveView] = useState<'table' | 'timeline' | 'kanban'>('table');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Project | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    
    // Estados para el cambio de estado del proyecto
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [projectToChangeStatus, setProjectToChangeStatus] = useState<Project | null>(null);
    
    // Estados para los nuevos modales
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [projectToViewDetails, setProjectToViewDetails] = useState<Project | null>(null);
    const [certifyDialogOpen, setCertifyDialogOpen] = useState(false);
    const [projectToCertify, setProjectToCertify] = useState<Project | null>(null);
    
    // Estado para el tipo de exportación a Excel
    const [exportFilterType, setExportFilterType] = useState<'week' | 'month' | 'year' | 'all'>('month');
    
    const [pageOptions] = useState([5, 10, 20, 50, 100]);

    useEffect(() => {
        // Ya no necesitamos cargar los proyectos manualmente
        fetchTeams();
        fetchCells();
        fetchAnalysts();
    }, []);    // Resetear paginación cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterEquipo, filterAnalista, filterEstado, selectedDateFilter, selectedYear, selectedMonth]);

    useEffect(() => {
        if (newProject.horas) {
            setNewProject(prev => ({
                ...prev,
                dias: Math.ceil(prev.horas! / HOURS_PER_DAY)
            }));
        }
    }, [newProject.horas]);

    useEffect(() => {
        if (newProject.fechaEntrega && newProject.fechaRealEntrega) {
            const entrega = new Date(newProject.fechaEntrega);
            const realEntrega = new Date(newProject.fechaRealEntrega);
            const diffTime = realEntrega.getTime() - entrega.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setNewProject(prev => ({
                ...prev,
                diasRetraso: Math.max(0, diffDays)
            }));
        }
    }, [newProject.fechaEntrega, newProject.fechaRealEntrega]);

    useEffect(() => {
        if (newProject.equipo) {
            setFilteredCells(cells.filter(cell => {
                const team = teams.find(t => t.name === newProject.equipo);
                return team ? cell.teamId === team.id : false;
            }));
        } else {
            setFilteredCells([]);
        }
    }, [newProject.equipo, cells, teams]);    useEffect(() => {
        // Solo actualizar el tipo de filtro de exportación según el filtro seleccionado
        switch (selectedDateFilter) {
            case 'week':
                if (exportFilterType !== 'all') {
                    setExportFilterType('week');
                }
                break;
            case 'custom-month':
            case 'month':
            default:
                if (exportFilterType !== 'all') {
                    setExportFilterType('month');
                }
                break;
        }
    }, [selectedDateFilter, exportFilterType]);

    // La función loadProjects ya no es necesaria porque usamos el hook useProjects
    
    // Función para calcular fechas basadas en los filtros actuales (para componentes legacy)
    const getDateRange = () => {
        const today = new Date();
        let start: Date;
        let end: Date;

        switch (selectedDateFilter) {
            case 'week':
                // Inicio de la semana actual (lunes)
                start = new Date(today);
                start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case 'custom-month':
                // Mes específico seleccionado del año seleccionado
                start = new Date(selectedYear, selectedMonth, 1);
                end = new Date(selectedYear, selectedMonth + 1, 0);
                break;
            case 'month':
            default:
                // Inicio del mes actual
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
        }
        
        // Asegurarnos de que las fechas estén normalizadas
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
    };

    const fetchTeams = async () => {
        try {
            const response = await fetch('/api/teams');
            const data = await response.json();
            setTeams(data);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const fetchCells = async () => {
        try {
            const response = await fetch('/api/cells');
            const data = await response.json();
            setCells(data);
        } catch (error) {
            console.error('Error fetching cells:', error);
        }
    };

    const fetchAnalysts = async () => {
        try {
            const response = await fetch('/api/analysts');
            const data = await response.json();
            setAnalysts(data);
        } catch (error) {
            console.error('Error fetching analysts:', error);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!newProject.idJira?.trim()) {
            newErrors.idJira = 'El ID de Jira es requerido';
        } else if (!/^[A-Z0-9]+-\d+$/i.test(newProject.idJira)) {
            newErrors.idJira = 'Formato inválido. Debe ser como "PROJ-123" o "PROJ1-152"';
        }

        if (!newProject.proyecto?.trim()) {
            newErrors.proyecto = 'El nombre del proyecto es requerido';
        }

        if (!newProject.equipo?.trim()) {
            newErrors.equipo = 'El equipo es requerido';
        }

        if (!newProject.celula?.trim()) {
            newErrors.celula = 'La célula es requerida';
        }

        if (!newProject.horas || newProject.horas <= 0) {
            newErrors.horas = 'Las horas deben ser mayores a 0';
        }

        if (!newProject.fechaEntrega) {
            newErrors.fechaEntrega = 'La fecha de entrega es requerida';
        }

        if (!newProject.analistaProducto?.trim()) {
            newErrors.analistaProducto = 'El analista de producto es requerido';
        }

        if (!newProject.planTrabajo?.trim()) {
            newErrors.planTrabajo = 'El plan de trabajo es requerido';
        }

        if (newProject.fechaRealEntrega && newProject.fechaCertificacion) {
            const realEntrega = new Date(newProject.fechaRealEntrega);
            const certificacion = new Date(newProject.fechaCertificacion);

            if (certificacion < realEntrega) {
                newErrors.fechaCertificacion = 'La fecha de certificación no puede ser anterior a la fecha real de entrega';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };    const handleDelete = async (idJira: string) => {
        try {
            // Utilizamos la función del hook que incluye todas las notificaciones
            await deleteProject(idJira);
        } catch (error) {
            console.error('Error al eliminar el proyecto:', error);
        }
    };    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        // Verificar que idJira no sea nulo para ediciones
        if (editingProject && (!newProject.idJira || !editingProject.idJira)) {
            toast.error('Error: No se encontró el ID de Jira para actualizar el proyecto');
            return;
        }

        try {
            setIsSubmitting(true);
            
            if (editingProject && editingProject.idJira) {
                // Actualizar proyecto existente usando idJira como identificador único
                await updateProject(editingProject.idJira, newProject);
            } else {
                // Crear nuevo proyecto
                await createProject(newProject);
            }
            
            // Cerrar el formulario y resetear
            setShowForm(false);
            setEditingProject(null);
            resetForm();
        } catch (error) {
            console.error('Error al guardar el proyecto:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewProject({});
        setErrors({});
    };
      const sortData = (data: Project[]) => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            // Añadir lógica para manejar el botón de cambio de estado
            if (!a || !b) return 0;
            
            const key = sortConfig.key as keyof Project;
            
            // Obtener valores seguros (usando nullish coalescing)
            const valA = a[key] ?? '';
            const valB = b[key] ?? '';
            
            // Lógica especial para fechas
            if (key === 'fechaEntrega' || key === 'fechaRealEntrega' || key === 'fechaCertificacion') {
                const dateA = valA ? new Date(valA as string).getTime() : 0;
                const dateB = valB ? new Date(valB as string).getTime() : 0;
                return sortConfig.direction === 'asc'
                    ? dateA - dateB
                    : dateB - dateA;
            } 
            
            // Si son strings, hacer comparación de strings
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortConfig.direction === 'asc' 
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }
            
            // Para otros tipos, comparación genérica
            return sortConfig.direction === 'asc'
                ? (valA < valB ? -1 : valA > valB ? 1 : 0)
                : (valA > valB ? -1 : valA < valB ? 1 : 0);
        });
    };

    const requestSort = (key: keyof Project) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key: keyof Project) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4 inline-block ml-1" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="h-4 w-4 inline-block ml-1 text-blue-600" />
            : <ChevronDown className="h-4 w-4 inline-block ml-1 text-blue-600" />;
    };

    // Función helper para formatear fechas
    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'UTC'
        });
    };
    
    const renderJiraId = (idJira: string | null | undefined) => {
        if (!idJira) return '';  // Manejar caso donde idJira sea nulo o indefinido
        
        const jiraUrl = getJiraUrl(idJira);
        if (!jiraUrl) return idJira;

        return (
            <a
                href={jiraUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
            >
                {idJira}
            </a>
        );
    };
    
    // Funciones para manejar el diálogo de cambio de estado
    const openStatusDialog = (project: Project) => {
        setProjectToChangeStatus(project);
        setStatusDialogOpen(true);
    };
    
    const closeStatusDialog = () => {
        setStatusDialogOpen(false);
        setProjectToChangeStatus(null);
    };
    
    // Funciones para manejar el diálogo de detalles del proyecto
    const openDetailsDialog = (project: Project) => {
        setProjectToViewDetails(project);
        setDetailsDialogOpen(true);
    };
    
    const closeDetailsDialog = () => {
        setDetailsDialogOpen(false);
        setProjectToViewDetails(null);
    };
    
    // Funciones para manejar el diálogo de certificación
    const openCertifyDialog = (project: Project) => {
        setProjectToCertify(project);
        setCertifyDialogOpen(true);
    };
    
    const closeCertifyDialog = () => {
        setCertifyDialogOpen(false);
        setProjectToCertify(null);
    };
    
    // Función para certificar un proyecto
    const handleCertifyProject = async (project: Project) => {
        try {
            setIsSubmitting(true);
            
            const updatedProject = {
                ...project,
                estado: 'certificado',
                fechaCertificacion: new Date(),
                estadoCalculado: 'Certificado' as const
            };
            
            await updateProject(project.idJira, updatedProject);
            
            toast.success(`Proyecto ${project.proyecto} certificado exitosamente`);
            closeCertifyDialog();
            
            // Refrescar los datos
            // Esto se hará automáticamente por los hooks de React Query
            
        } catch (error) {
            console.error('Error al certificar proyecto:', error);
            toast.error('Error al certificar el proyecto');
        } finally {
            setIsSubmitting(false);
        }
    };    // Función para filtrar proyectos con fechas (solo para vista timeline)
    const filterProjectsByDate = (projectList: Project[]) => {
        const { start: startDate, end: endDate } = getDateRange();
        
        return projectList.filter(project => {
            if (!project.fechaEntrega) return false;
            
            const fechaEntrega = new Date(project.fechaEntrega);
            fechaEntrega.setHours(0, 0, 0, 0);
            
            const fechaCertificacion = project.fechaCertificacion ? new Date(project.fechaCertificacion) : null;
            if (fechaCertificacion) fechaCertificacion.setHours(0, 0, 0, 0);
            
            // Un proyecto coincide con el rango de fechas si:
            // 1. Su fecha de entrega está dentro del rango
            // 2. Su fecha de certificación está dentro del rango
            // 3. Su período abarca el rango completo (comenzó antes y termina después)
            const matchesDate = 
                (fechaEntrega >= startDate && fechaEntrega <= endDate) ||
                (fechaCertificacion && fechaCertificacion >= startDate && fechaCertificacion <= endDate) ||
                (fechaEntrega <= startDate && (fechaCertificacion ? fechaCertificacion >= endDate : true));
            
            return matchesDate;
        });
    };
    
    // Seleccionar los proyectos correctos según la vista activa
    const sourceProjects = activeView === 'timeline' ? allProjects : projects;
    const isLoadingSource = activeView === 'timeline' ? isLoadingAllProjects : isLoadingProjects;
    const isErrorSource = activeView === 'timeline' ? isErrorAllProjects : isErrorProjects;
    
    // Aplicar filtros y ordenamiento
    let filteredForView = sourceProjects.filter(project => {
        // Comprobar que las propiedades existan antes de acceder a ellas
        const matchesSearch =
            (project.idJira?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (project.proyecto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (project.equipo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (project.analistaProducto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (project.descripcion?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            
        const matchesEquipo = !filterEquipo || project.equipo === filterEquipo;
        const matchesAnalista = !filterAnalista || project.analistaProducto === filterAnalista;
        const matchesEstado = !filterEstado || project.estadoCalculado === filterEstado;
        
        return matchesSearch && matchesEquipo && matchesAnalista && matchesEstado;
    });
    
    // Para la vista timeline, aplicar filtro de fecha del lado del cliente
    if (activeView === 'timeline') {
        filteredForView = filterProjectsByDate(filteredForView);
    }
    
    // Aplicar ordenamiento
    const allFilteredProjects = sortData(filteredForView);
    
    // Cálculos para paginación
    const totalItems = allFilteredProjects.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    // Asegurar que currentPage esté dentro de los límites válidos
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    if (validCurrentPage !== currentPage) {
        setCurrentPage(validCurrentPage);
    }
    
    // Obtener los proyectos para la página actual
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const filteredProjects = allFilteredProjects.slice(startIndex, startIndex + itemsPerPage);
    
    const equipos = Array.from(new Set(projects.map(p => p.equipo || '').filter(Boolean)));
    const analistas = Array.from(new Set(projects.map(p => p.analistaProducto || '').filter(Boolean)));
    
    return (
        <div className="space-y-4">
            {/* Dashboard de Resumen y KPIs - usando allFilteredProjects para mostrar datos de todos los proyectos filtrados */}
            {!isLoadingSource && !isErrorSource && allFilteredProjects.length > 0 && (
                <ProjectDashboard projects={allFilteredProjects} />
            )}
            
            <div className="flex justify-between items-center flex-wrap gap-4">                <div className="flex space-x-2">
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        onClick={() => setShowForm(true)}
                    >
                        Nuevo Proyecto
                    </button>
                    
                    <div className="flex items-center space-x-2">
                        <select 
                            className="border rounded px-3 py-2"
                            value={exportFilterType}
                            onChange={(e) => setExportFilterType(e.target.value as 'week' | 'month' | 'year' | 'all')}
                            title="Seleccionar tipo de exportación"
                        >                            <option value="week">Exportar proyectos semanales</option>
                            <option value="month">Exportar proyectos mensuales</option>
                            <option value="year">Exportar proyectos anuales</option>
                            <option value="all">Exportar TODOS los proyectos</option>
                        </select>
                          <ExportToExcelButton 
                            projects={exportFilterType === 'all' ? projects : allFilteredProjects} 
                            filterType={exportFilterType}
                        />
                    </div><div className="flex rounded-lg overflow-hidden border">                        <button
                            className={`px-4 py-2 transition-colors ${
                                activeView === 'table'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => setActiveView('table')}
                        >
                            Vista Tabla
                        </button>
                        <button
                            className={`px-4 py-2 transition-colors ${
                                activeView === 'timeline'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => setActiveView('timeline')}
                        >
                            Vista Calendario
                        </button>
                        <button
                            className={`px-4 py-2 transition-colors ${
                                activeView === 'kanban'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => setActiveView('kanban')}
                        >
                            Vista Kanban
                        </button>
                    </div>
                </div>                <div className="flex items-center space-x-4">                    {/* Filtros de fecha */}
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setSelectedDateFilter('week')}
                            className={`px-3 py-1.5 rounded text-sm transition-colors ${
                                selectedDateFilter === 'week'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            Semana actual
                        </button>
                        <button
                            onClick={() => setSelectedDateFilter('month')}
                            className={`px-3 py-1.5 rounded text-sm transition-colors ${
                                selectedDateFilter === 'month'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            Mes actual
                        </button>
                        <div className={`flex gap-2 items-center px-2 py-1 rounded ${
                            selectedDateFilter === 'custom-month' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100'
                        }`}>
                            <select 
                                className={`text-sm rounded ${
                                    selectedDateFilter === 'custom-month' ? 'bg-blue-500' : 'bg-gray-100'
                                }`}
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(parseInt(e.target.value));
                                    setSelectedDateFilter('custom-month');
                                }}
                            >
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <select 
                                className={`text-sm rounded ${
                                    selectedDateFilter === 'custom-month' ? 'bg-blue-500' : 'bg-gray-100'
                                }`}
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(parseInt(e.target.value));
                                    setSelectedDateFilter('custom-month');
                                }}
                            >
                                {Array.from({ length: 12 }, (_, i) => i).map(month => (
                                    <option key={month} value={month}>
                                        {new Date(2000, month, 1).toLocaleString('es-ES', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* Filtros básicos */}
                    <div className="flex flex-wrap gap-2">
                        <select
                            className="border rounded px-3 py-2"
                            value={filterEquipo}
                            onChange={(e) => setFilterEquipo(e.target.value)}
                        >
                            <option value="">Todos los equipos</option>
                            {equipos.map(equipo => (
                                <option key={equipo} value={equipo}>{equipo}</option>
                            ))}
                        </select>
                        <select
                            className="border rounded px-3 py-2"
                            value={filterAnalista}
                            onChange={(e) => setFilterAnalista(e.target.value)}
                        >
                            <option value="">Todos los analistas</option>
                            {analistas.map(analista => (
                                <option key={analista} value={analista}>{analista}</option>
                            ))}
                        </select>
                        <select
                            className="border rounded px-3 py-2"
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="Por Iniciar">Por Iniciar</option>
                            <option value="En Progreso">En Progreso</option>
                            <option value="Certificado">Certificado</option>
                            <option value="Completado">Completado</option>
                            <option value="Finalizado">Finalizado</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Buscar proyecto..."
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg space-y-4 w-full max-w-xl max-h-[90vh] overflow-y-auto mx-auto z-50">
                        <h2 className="text-xl font-bold mb-4">{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* ID Jira */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    ID Jira
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    placeholder="Ej: ABC1-123, ABC-123, PROJ-999"
                                    pattern="[A-Z0-9]+-[0-9]+"
                                    className={`border p-2 rounded w-full ${errors.idJira ? 'border-red-500' : ''}`}
                                    value={newProject.idJira || ''}
                                    onChange={(e) => {
                                        setNewProject({ ...newProject, idJira: e.target.value.toUpperCase() });
                                        if (errors.idJira) {
                                            setErrors({ ...errors, idJira: '' });
                                        }
                                    }}
                                    required
                                />
                                {errors.idJira && <p className="text-red-500 text-sm">{errors.idJira}</p>}
                            </div>

                            {/* Proyecto */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Proyecto
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    placeholder="Nombre del proyecto"
                                    className={`border p-2 rounded w-full ${errors.proyecto ? 'border-red-500' : ''}`}
                                    value={newProject.proyecto || ''}
                                    onChange={(e) => {
                                        setNewProject({ ...newProject, proyecto: e.target.value });
                                        if (errors.proyecto) setErrors({ ...errors, proyecto: '' });
                                    }}
                                    required
                                />
                                {errors.proyecto && <p className="text-red-500 text-sm">{errors.proyecto}</p>}
                            </div>

                            {/* Equipo */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Equipo
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={`border p-2 rounded w-full ${errors.equipo ? 'border-red-500' : ''}`}
                                    value={newProject.equipo || ''}
                                    onChange={(e) => {
                                        setNewProject(prev => ({
                                            ...prev,
                                            equipo: e.target.value,
                                            celula: '' // Reset célula when team changes
                                        }));
                                        if (errors.equipo) setErrors({ ...errors, equipo: '' });
                                    }}
                                    required
                                >
                                    <option value="">Seleccionar equipo</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.name}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.equipo && <p className="text-red-500 text-sm">{errors.equipo}</p>}
                            </div>

                            {/* Célula */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Célula
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={`border p-2 rounded w-full ${errors.celula ? 'border-red-500' : ''}`}
                                    value={newProject.celula || ''}
                                    onChange={(e) => {
                                        setNewProject({ ...newProject, celula: e.target.value });
                                        if (errors.celula) setErrors({ ...errors, celula: '' });
                                    }}
                                    required
                                    disabled={!newProject.equipo} // Disable if no team is selected
                                >
                                    <option value="">Seleccionar célula</option>
                                    {filteredCells.map(cell => (
                                        <option key={cell.id} value={cell.name}>
                                            {cell.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.celula && <p className="text-red-500 text-sm">{errors.celula}</p>}
                                {!newProject.equipo && (
                                    <p className="text-sm text-gray-500">Selecciona un equipo primero</p>
                                )}
                            </div>

                            {/* Horas */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Horas
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Número de horas"
                                    className={`border p-2 rounded w-full ${errors.horas ? 'border-red-500' : ''}`}
                                    value={newProject.horas || ''}
                                    onChange={(e) => {
                                        const hours = parseInt(e.target.value);
                                        setNewProject({ ...newProject, horas: hours });
                                        if (errors.horas) setErrors({ ...errors, horas: '' });
                                    }}
                                    required
                                />
                                {errors.horas && <p className="text-red-500 text-sm">{errors.horas}</p>}
                                <p className="text-sm text-gray-500">Las horas se convertirán automáticamente a días (9 horas = 1 día)</p>
                            </div>

                            {/* Días (calculado automáticamente) */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Días (Automático)</label>
                                <input
                                    type="number"
                                    placeholder="Días calculados"
                                    className="border p-2 rounded w-full bg-gray-100"
                                    value={newProject.dias || ''}
                                    readOnly
                                />
                            </div>

                            {/* Fecha Entrega */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Fecha de Entrega Planificada
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    className={`border p-2 rounded w-full ${errors.fechaEntrega ? 'border-red-500' : ''}`}
                                    value={newProject.fechaEntrega ? new Date(newProject.fechaEntrega).toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                        setNewProject({ ...newProject, fechaEntrega: new Date(e.target.value) });
                                        if (errors.fechaEntrega) setErrors({ ...errors, fechaEntrega: '' });
                                    }}
                                    required
                                />
                                {errors.fechaEntrega && <p className="text-red-500 text-sm">{errors.fechaEntrega}</p>}
                            </div>

                            {/* Fecha Real Entrega */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Fecha Real de Entrega</label>
                                <input
                                    type="date"
                                    className={`border p-2 rounded w-full ${errors.fechaRealEntrega ? 'border-red-500' : ''}`}
                                    value={newProject.fechaRealEntrega ? new Date(newProject.fechaRealEntrega).toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : null;
                                        setNewProject({ ...newProject, fechaRealEntrega: date || undefined });
                                        if (errors.fechaRealEntrega) setErrors({ ...errors, fechaRealEntrega: '' });
                                    }}
                                />
                                {errors.fechaRealEntrega && <p className="text-red-500 text-sm">{errors.fechaRealEntrega}</p>}
                            </div>

                            {/* Fecha Certificación */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Fecha de Certificación</label>
                                <input
                                    type="date"
                                    className={`border p-2 rounded w-full ${errors.fechaCertificacion ? 'border-red-500' : ''}`}
                                    value={newProject.fechaCertificacion ? new Date(newProject.fechaCertificacion).toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : null;
                                        setNewProject({ ...newProject, fechaCertificacion: date || undefined });
                                        if (errors.fechaCertificacion) setErrors({ ...errors, fechaCertificacion: '' });
                                    }}
                                />
                                {errors.fechaCertificacion && <p className="text-red-500 text-sm">{errors.fechaCertificacion}</p>}
                            </div>

                            {/* Distribución de Horas */}
                            {newProject.horas && newProject.fechaEntrega && newProject.fechaCertificacion && (
                                <div className="space-y-2 border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Distribución de Horas por Día
                                        <span className="text-blue-600 ml-2 text-xs">
                                            ({(() => {
                                                const startDate = new Date(newProject.fechaEntrega);
                                                const endDate = new Date(newProject.fechaCertificacion);
                                                const workingDates = getWorkingDatesArray(startDate, endDate);
                                                return workingDates.length;
                                            })()} días laborales)
                                        </span>
                                    </label>
                                    {(() => {
                                        const startDate = new Date(newProject.fechaEntrega);
                                        const endDate = new Date(newProject.fechaCertificacion);
                                        const workingDates = getWorkingDatesArray(startDate, endDate);
                                        const totalHours = newProject.horas;
                                        
                                        // Calcular distribución automática solo para días laborales
                                        const workingDaysCount = workingDates.length;
                                        const hoursPerDay = Math.floor(totalHours / workingDaysCount);
                                        const remainingHours = totalHours % workingDaysCount;
                                        const distribution = Array(workingDaysCount).fill(hoursPerDay);
                                        for (let i = 0; i < remainingHours; i++) {
                                            distribution[i]++;
                                        }

                                        // Inicializar horasPorDia si no existe o si el tamaño cambió
                                        if (!newProject.horasPorDia || newProject.horasPorDia.length !== workingDaysCount) {
                                            setNewProject(prev => ({ ...prev, horasPorDia: distribution }));
                                        }

                                        return (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {workingDates.map((currentDate, index) => {
                                                        const hours = (newProject.horasPorDia || distribution)[index];
                                                        const dayName = currentDate.toLocaleDateString('es-ES', { weekday: 'short' });
                                                        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                                                        const isHoliday = isNonWorkingDay(currentDate) && !isWeekend;
                                                        
                                                        return (
                                                            <div key={index} className="space-y-1">
                                                                <label className="text-xs text-gray-600 flex flex-col">
                                                                    <span>Día {index + 1}</span>
                                                                    <span className="text-xs">
                                                                        {dayName} {currentDate.toLocaleDateString('es-ES', { 
                                                                            month: 'short', 
                                                                            day: 'numeric' 
                                                                        })}
                                                                        {isHoliday && <span className="text-red-500 ml-1">🎉</span>}
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.5"
                                                                    value={hours}
                                                                    onChange={(e) => {
                                                                        const newDistribution = [...(newProject.horasPorDia || distribution)];
                                                                        newDistribution[index] = parseFloat(e.target.value) || 0;
                                                                        setNewProject(prev => ({ ...prev, horasPorDia: newDistribution }));
                                                                    }}
                                                                    className="w-full p-1 text-xs border rounded"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">
                                                        Total distribuido: {(newProject.horasPorDia || distribution).reduce((sum, h) => sum + (h || 0), 0)} horas
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setNewProject(prev => ({ ...prev, horasPorDia: distribution }));
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                                    >
                                                        Redistribuir automáticamente
                                                    </button>
                                                </div>
                                                {Math.abs((newProject.horasPorDia || distribution).reduce((sum, h) => sum + (h || 0), 0) - totalHours) > 0.1 && (
                                                    <p className="text-orange-600 text-xs">
                                                        ⚠️ La suma de horas distribuidas no coincide con el total del proyecto
                                                    </p>
                                                )}
                                                
                                                {/* Información adicional sobre días excluidos */}
                                                {(() => {
                                                    const totalDaysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
                                                    const excludedDays = totalDaysInRange - workingDaysCount;
                                                    
                                                    if (excludedDays > 0) {
                                                        return (
                                                            <p className="text-gray-500 text-xs bg-gray-50 p-2 rounded">
                                                                ℹ️ Se excluyeron {excludedDays} día(s) no laborales (fines de semana y festivos)
                                                            </p>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                            
                            {/* Días de Retraso (calculado automáticamente) */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Días de Retraso (Automático)</label>
                                <input
                                    type="number"
                                    placeholder="Días de retraso"
                                    className="border p-2 rounded w-full bg-gray-100"
                                    value={newProject.diasRetraso || 0}
                                    readOnly
                                />
                            </div>
                            
                            {/* Estado del proyecto */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Estado del Proyecto</label>
                                <select
                                    className="border p-2 rounded w-full"
                                    value={newProject.estadoCalculado || 'Por Iniciar'}
                                    onChange={(e) => {
                                        const nuevoEstado = e.target.value as 'Por Iniciar' | 'En Progreso' | 'Certificado';
                                        
                                        // Mapear el estado calculado al estado de base de datos
                                        let estadoDB: string;
                                        switch (nuevoEstado) {
                                            case 'Por Iniciar':
                                                estadoDB = 'pendiente';
                                                break;
                                            case 'En Progreso':
                                                estadoDB = 'en_progreso';
                                                break;
                                            case 'Certificado':
                                                estadoDB = 'certificado';
                                                break;
                                            default:
                                                estadoDB = 'pendiente';
                                        }
                                        
                                        setNewProject({ 
                                            ...newProject,
                                            estado: estadoDB,
                                            estadoCalculado: nuevoEstado
                                        });
                                        
                                        // Si se marca como certificado y no tiene fecha de certificación, establecerla automáticamente
                                        if (e.target.value === 'Certificado' && !newProject.fechaCertificacion) {
                                            setNewProject(prev => ({ 
                                                ...prev, 
                                                estado: estadoDB,
                                                estadoCalculado: nuevoEstado,
                                                fechaCertificacion: new Date() 
                                            }));
                                        }
                                    }}
                                >
                                    <option value="Por Iniciar">Por Iniciar</option>
                                    <option value="En Progreso">En Progreso</option>
                                    <option value="Certificado">Certificado</option>
                                </select>
                                <p className="text-sm text-gray-500">
                                    El estado se calcula automáticamente según las fechas, pero puede modificarse manualmente.
                                </p>
                            </div>

                            {/* Analista Producto */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Analista de Producto
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={`border p-2 rounded w-full ${errors.analistaProducto ? 'border-red-500' : ''}`}
                                    value={newProject.analistaProducto || ''}
                                    onChange={(e) => {
                                        setNewProject({ ...newProject, analistaProducto: e.target.value });
                                        if (errors.analistaProducto) setErrors({ ...errors, analistaProducto: '' });
                                    }}
                                    required
                                >
                                    <option value="">Seleccionar analista</option>
                                    {analysts.map(analyst => (
                                        <option key={analyst.id} value={analyst.name}>
                                            {analyst.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.analistaProducto && <p className="text-red-500 text-sm">{errors.analistaProducto}</p>}
                            </div>

                            {/* Plan de Trabajo */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Plan de Trabajo
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    placeholder="Descripción del plan de trabajo"
                                    className={`border p-2 rounded w-full h-24 ${errors.planTrabajo ? 'border-red-500' : ''}`}
                                    value={newProject.planTrabajo || ''}
                                    onChange={(e) => {
                                        setNewProject({ ...newProject, planTrabajo: e.target.value });
                                        if (errors.planTrabajo) setErrors({ ...errors, planTrabajo: '' });
                                    }}
                                    required
                                />
                                {errors.planTrabajo && <p className="text-red-500 text-sm">{errors.planTrabajo}</p>}
                            </div>

                            <div className="flex justify-end space-x-2">                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingProject(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
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
                                    ) : (
                                        editingProject ? 'Actualizar' : 'Guardar'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}            {isLoadingSource ? (
                <div className="flex justify-center items-center p-8">
                    <div className="flex flex-col items-center">
                        <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-600">Cargando proyectos...</p>
                    </div>
                </div>
            ) : isErrorSource ? (
                <div className="flex justify-center items-center p-8 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex flex-col items-center text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-red-800 font-medium">Error al cargar los proyectos</p>
                        <p className="text-red-600 mt-1">Por favor, intente nuevamente más tarde</p>
                    </div>
                </div>            ) : activeView === 'timeline' ? (
                <>
                    {/* Mensajes de depuración para vacaciones */}
                    
                    <TimelineView
                        projects={allFilteredProjects} // Pasar todos los proyectos filtrados, no solo los de la página actual
                        analysts={analysts}
                        filterAnalista={filterAnalista}
                        filterEquipo={filterEquipo}
                        startDate={getDateRange().start}
                        endDate={getDateRange().end}
                        selectedDateFilter={selectedDateFilter}
                        vacations={vacations} // Pasar las vacaciones de los analistas
                    />
                </>
            ) : activeView === 'kanban' ? (
                <KanbanView
                    projects={allFilteredProjects} // Usar todos los proyectos filtrados, sin paginación
                    startDate={getDateRange().start}
                    endDate={getDateRange().end}
                    selectedDateFilter={selectedDateFilter}
                    onEditProject={(project) => {
                        if (!project.idJira) {
                            toast.error('No se puede editar un proyecto sin ID de Jira');
                            return;
                        }
                        setEditingProject(project);
                        
                        // Mapear el estado de BD al estado calculado para que se muestre correctamente en el select
                        let estadoCalculadoParaSelect: 'Por Iniciar' | 'En Progreso' | 'Certificado';
                        switch (project.estado) {
                            case 'pendiente':
                                estadoCalculadoParaSelect = 'Por Iniciar';
                                break;
                            case 'en_progreso':
                                estadoCalculadoParaSelect = 'En Progreso';
                                break;
                            case 'certificado':
                                estadoCalculadoParaSelect = 'Certificado';
                                break;
                            default:
                                // Si no hay estado o es desconocido, usar el estadoCalculado si existe
                                estadoCalculadoParaSelect = (project.estadoCalculado as 'Por Iniciar' | 'En Progreso' | 'Certificado') || 'Por Iniciar';
                        }
                        
                        setNewProject({
                            ...project,
                            estadoCalculado: estadoCalculadoParaSelect
                        });
                        setShowForm(true);
                    }}
                    onDeleteProject={(project) => {
                        if (!project.idJira) {
                            toast.error('No se puede eliminar un proyecto sin ID de Jira');
                            return;
                        }
                        toast.info('¿Estás seguro?', {
                            action: {
                                label: 'Eliminar',
                                onClick: () => handleDelete(project.idJira)
                            },
                            description: 'Esta acción no se puede deshacer',
                            cancel: {
                                label: 'Cancelar',
                                onClick: () => {}
                            }
                        });                    
                    }}
                    onChangeStatus={(project) => openStatusDialog(project)}
                />
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full">
<thead>
<tr>
<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Id Jira</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Proyecto</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Equipo</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Celula</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Horas</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Días</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 group min-w-[140px]" onClick={() => requestSort('fechaEntrega')}><div className="flex items-center"><span className="mr-1">Fecha Entrega</span>{getSortIcon('fechaEntrega')}</div></th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 group min-w-[140px]" onClick={() => requestSort('fechaRealEntrega')}><div className="flex items-center"><span className="mr-1">Fecha Real</span>{getSortIcon('fechaRealEntrega')}</div></th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 group min-w-[140px]" onClick={() => requestSort('fechaCertificacion')}><div className="flex items-center"><span className="mr-1">Certificación</span>{getSortIcon('fechaCertificacion')}</div></th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 group min-w-[140px]" onClick={() => requestSort('diasRetraso')}><div className="flex items-center"><span className="mr-1">Días Retraso</span>{getSortIcon('diasRetraso')}</div></th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Analista QA</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 group min-w-[140px]" onClick={() => requestSort('estadoCalculado')}><div className="flex items-center"><span className="mr-1">Estado</span>{getSortIcon('estadoCalculado')}</div></th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Plan de Trabajo</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Acciones</th></tr></thead>
<tbody className="bg-white divide-y divide-gray-200">
{filteredProjects.length === 0 ? (
    <tr>
        <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No hay proyectos que coincidan con los criterios de búsqueda</p>
            <p className="text-sm">Intenta ajustar los filtros o crear un nuevo proyecto</p>
        </td>
    </tr>
) : filteredProjects.filter(project => project && project.idJira).map((project, index) => (
<tr
    key={index}
    className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 hover:shadow-sm`}
>
    <td className="px-4 py-2 text-sm font-medium text-blue-600 whitespace-nowrap">{renderJiraId(project.idJira)}</td>
    <td className="px-4 py-2 text-sm text-gray-900 max-w-[260px] truncate whitespace-nowrap cursor-help" title={project.proyecto || ''}>{project.proyecto || ''}</td>
    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.equipo || ''}</td>
    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.celula || ''}</td>
    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.horas || 0}</td>
    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.dias || 0}</td>
    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.fechaEntrega && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{formatDate(project.fechaEntrega)}</span>)}</td>
    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.fechaRealEntrega && (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.diasRetraso > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{formatDate(project.fechaRealEntrega)}</span>)}</td>
        <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
            {project.fechaCertificacion && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 max-w-[120px] truncate cursor-help" title={formatDate(project.fechaCertificacion)}>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {formatDate(project.fechaCertificacion)}
                </span>
            )}
        </td>
    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.diasRetraso || 0}</td>
    <td className="px-4 py-2 text-sm text-gray-900 max-w-[180px] truncate whitespace-nowrap cursor-help" title={project.analistaProducto || ''}>{project.analistaProducto || ''}</td>
    <td className="px-4 py-2 text-sm text-gray-900">
    <div className="flex flex-col items-start">
        {project.estadoCalculado ? (
            <span 
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 max-w-[120px] truncate ${
                    project.estadoCalculado === 'Por Iniciar' 
                        ? 'bg-amber-100 text-amber-800' 
                        : project.estadoCalculado === 'En Progreso' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                }`}
                title={project.estadoCalculado}
                onClick={() => openStatusDialog(project)}
            >
                {project.estadoCalculado === 'Por Iniciar' && <Clock className="w-4 h-4 text-amber-400" />}
                {project.estadoCalculado === 'En Progreso' && <Clock className="w-4 h-4 text-blue-400" />}
                {project.estadoCalculado === 'Certificado' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {project.estadoCalculado}
            </span>
        ) : (
            <span 
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:opacity-80"
                onClick={() => openStatusDialog(project)}
            >
                <Clock className="w-4 h-4 text-gray-400" />
                Sin estado
            </span>
        )}
    </div>
</td><td className="px-4 py-2 text-sm text-gray-900 max-w-[300px] truncate whitespace-nowrap cursor-help" title={project.planTrabajo || ''}>{project.planTrabajo || ''}</td><td className="px-4 py-2 text-sm whitespace-nowrap">
  <div className="flex items-center gap-1 sm:gap-2">
    {/* Botón Ver Detalles */}
    <button
      onClick={() => openDetailsDialog(project)}
      className="group relative p-1 sm:p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 ease-in-out transform hover:scale-105"
      title="Ver detalles"
    >
      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        Ver detalles
      </span>
    </button>

    {/* Botón Editar */}
    <button
      onClick={() => {
        if (!project.idJira) {
          toast.error('No se puede editar un proyecto sin ID de Jira');
          return;
        }
        setEditingProject(project);

        // Mapear el estado de BD al estado calculado para que se muestre correctamente en el select
        let estadoCalculadoParaSelect: 'Por Iniciar' | 'En Progreso' | 'Certificado';
        switch (project.estado) {
          case 'pendiente':
            estadoCalculadoParaSelect = 'Por Iniciar';
            break;
          case 'en_progreso':
            estadoCalculadoParaSelect = 'En Progreso';
            break;
          case 'certificado':
            estadoCalculadoParaSelect = 'Certificado';
            break;
          default:
            // Si no hay estado o es desconocido, usar el estadoCalculado si existe
            estadoCalculadoParaSelect = (project.estadoCalculado as 'Por Iniciar' | 'En Progreso' | 'Certificado') || 'Por Iniciar';
        }

        setNewProject({
          ...project,
          estadoCalculado: estadoCalculadoParaSelect
        });
        setShowForm(true);
      }}
      className="group relative p-1 sm:p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all duration-200 ease-in-out transform hover:scale-105"
      title="Editar proyecto"
    >
      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        Editar proyecto
      </span>
    </button>

    {/* Botón Certificar - Solo si no está certificado */}
    {project.estado?.toLowerCase() !== 'certificado' && (
      <button
        onClick={() => openCertifyDialog(project)}
        className="group relative p-1 sm:p-1.5 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 ease-in-out transform hover:scale-105"
        title="Certificar proyecto"
      >
        <Award className="w-3 h-3 sm:w-4 sm:h-4" />
        {/* Tooltip */}
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          Certificar proyecto
        </span>
      </button>
    )}

    {/* Botón Eliminar */}
    <button
      onClick={() => {
        if (!project.idJira) {
          toast.error('No se puede eliminar un proyecto sin ID de Jira');
          return;
        }
        toast.info('¿Estás seguro?', {
          action: {
            label: 'Eliminar',
            onClick: () => handleDelete(project.idJira)
          },
          description: 'Esta acción no se puede deshacer',
          cancel: {
            label: 'Cancelar',
            onClick: () => {}
          }
        });
      }}
      className="group relative p-1 sm:p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 ease-in-out transform hover:scale-105"
      title="Eliminar proyecto"
    >
      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        Eliminar proyecto
      </span>
    </button>
  </div>
</td></tr>
))}
</tbody>
                    </table>
                    
                    {/* Controles de paginación */}
                    <PaginationControls
                        currentPage={validCurrentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        pageOptions={pageOptions}
                        startIndex={startIndex}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </div>
            )}
            
            {/* Widget de Certificaciones de la Semana - Movido al final */}
            {!isLoadingAllProjects && !isErrorAllProjects && allProjects.length > 0 && (
                <WeeklyCertificationWidget projects={allProjects} />
            )}
              
            {/* Modal de Detalles del Proyecto */}
            <Dialog open={detailsDialogOpen} onOpenChange={closeDetailsDialog}>
              <DialogContent className="max-w-2xl sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Detalles del Proyecto
                  </DialogTitle>
                  <DialogDescription>
                    Información completa del proyecto seleccionado
                  </DialogDescription>
                </DialogHeader>
                
                {projectToViewDetails && (
                  <div className="space-y-6">
                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Información Básica</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-gray-500">ID Jira:</span>
                            <p className="font-medium">{projectToViewDetails.idJira}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Proyecto:</span>
                            <p className="font-medium">{projectToViewDetails.proyecto}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Nombre:</span>
                            <p className="font-medium">{projectToViewDetails.nombre || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Equipo:</span>
                            <p className="font-medium">{projectToViewDetails.equipo}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Célula:</span>
                            <p className="font-medium">{projectToViewDetails.celula}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Estado y Fechas</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-gray-500">Estado:</span>
                            <Badge 
                              variant={projectToViewDetails.estado === 'certificado' ? 'default' : 'secondary'}
                              className="ml-2"
                            >
                              {projectToViewDetails.estadoCalculado || projectToViewDetails.estado || 'Sin estado'}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Fecha Entrega:</span>
                            <p className="font-medium">
                              {projectToViewDetails.fechaEntrega ? new Date(projectToViewDetails.fechaEntrega).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Fecha Real Entrega:</span>
                            <p className="font-medium">
                              {projectToViewDetails.fechaRealEntrega ? new Date(projectToViewDetails.fechaRealEntrega).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Fecha Certificación:</span>
                            <p className="font-medium">
                              {projectToViewDetails.fechaCertificacion ? new Date(projectToViewDetails.fechaCertificacion).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Días de Retraso:</span>
                            <p className={`font-medium ${projectToViewDetails.diasRetraso > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {projectToViewDetails.diasRetraso}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Esfuerzo y Recursos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Esfuerzo</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-gray-500">Horas Estimadas:</span>
                            <p className="font-medium">{projectToViewDetails.horas} horas</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Días Estimados:</span>
                            <p className="font-medium">{projectToViewDetails.dias} días</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Horas por Día:</span>
                            <p className="font-medium">
                              {projectToViewDetails.horasPorDia ? projectToViewDetails.horasPorDia.join(', ') : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Recursos</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-gray-500">Analista Producto:</span>
                            <p className="font-medium">{projectToViewDetails.analistaProducto}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Analistas Asignados:</span>
                            <p className="font-medium">
                              {projectToViewDetails.analistas && projectToViewDetails.analistas.length > 0 
                                ? projectToViewDetails.analistas.join(', ') 
                                : 'Ninguno asignado'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Descripción y Plan de Trabajo */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Descripción</h3>
                        <p className="text-sm bg-gray-50 p-3 rounded-md">
                          {projectToViewDetails.descripcion || 'Sin descripción'}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Plan de Trabajo</h3>
                        <p className="text-sm bg-gray-50 p-3 rounded-md">
                          {projectToViewDetails.planTrabajo || 'Sin plan de trabajo definido'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button variant="outline" onClick={closeDetailsDialog}>
                    Cerrar
                  </Button>
                  {projectToViewDetails && (
                    <Button 
                      onClick={() => {
                        window.open(getJiraUrl(projectToViewDetails.idJira), '_blank');
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Ver en Jira
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Modal de Confirmación de Certificación */}
            <Dialog open={certifyDialogOpen} onOpenChange={closeCertifyDialog}>
              <DialogContent className="max-w-md sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Certificar Proyecto
                  </DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de que deseas certificar este proyecto?
                  </DialogDescription>
                </DialogHeader>
                
                {projectToCertify && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{projectToCertify.proyecto}</h4>
                      <p className="text-sm text-gray-600 mb-2">ID: {projectToCertify.idJira}</p>
                      <p className="text-sm text-gray-600">Equipo: {projectToCertify.equipo}</p>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> Una vez certificado, el proyecto se marcará como completado y se registrará la fecha de certificación actual.
                      </p>
                    </div>
                  </div>
                )}
                
                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
                  <Button variant="outline" onClick={closeCertifyDialog} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => projectToCertify && handleCertifyProject(projectToCertify)}
                    disabled={isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSubmitting ? 'Certificando...' : 'Certificar Proyecto'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Diálogo de cambio de estado */}
            {statusDialogOpen && projectToChangeStatus && (
                <ChangeProjectStatusDialog
                    project={projectToChangeStatus}
                    isOpen={statusDialogOpen}
                    onClose={closeStatusDialog}
                />
            )}
        </div>
    );
}
