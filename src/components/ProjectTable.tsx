"use client";

import { Project } from '@/models/Project';
import { useState, useEffect } from 'react';

const HOURS_PER_DAY = 9;

export default function ProjectTable() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newProject, setNewProject] = useState<Partial<Project>>({});

    useEffect(() => {
        loadProjects();
    }, []);

    // Calculate days when hours change
    useEffect(() => {
        if (newProject.horas) {
            setNewProject(prev => ({
                ...prev,
                dias: Math.ceil(prev.horas! / HOURS_PER_DAY)
            }));
        }
    }, [newProject.horas]);

    // Calculate delay days when dates change
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

    async function loadProjects() {
        const response = await fetch('/api/projects');
        const data = await response.json();
        setProjects(data);
    }

    async function handleSave(project: Project) {
        const url = '/api/projects';
        const method = editingProject ? 'PUT' : 'POST';
        const body = editingProject ? 
            JSON.stringify({ idJira: project.idJira, project }) : 
            JSON.stringify(project);

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body
        });

        if (response.ok) {
            await loadProjects();
            setEditingProject(null);
            setShowForm(false);
            setNewProject({});
        }
    }

    async function handleDelete(idJira: string) {
        if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
            const response = await fetch('/api/projects', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idJira })
            });

            if (response.ok) {
                await loadProjects();
            }
        }
    }

    const filteredProjects = projects.filter(project => 
        project.idJira.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.analistaProducto.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    onClick={() => setShowForm(true)}
                >
                    Nuevo Proyecto
                </button>
                <div className="w-64">
                    <input
                        type="text"
                        placeholder="Buscar proyecto..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-lg shadow-lg space-y-4">
                        <h2 className="text-xl font-bold mb-4">{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleSave(newProject as Project);
                        }} className="space-y-4">
                            {/* ID Jira */}
                            <div className="space-y-2">
                                <input
                                    placeholder="ID Jira"
                                    className="border p-2 rounded w-full"
                                    value={newProject.idJira || ''}
                                    onChange={(e) => setNewProject({ ...newProject, idJira: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Proyecto */}
                            <div className="space-y-2">
                                <input
                                    placeholder="Proyecto"
                                    className="border p-2 rounded w-full"
                                    value={newProject.proyecto || ''}
                                    onChange={(e) => setNewProject({ ...newProject, proyecto: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Equipo */}
                            <div className="space-y-2">
                                <input
                                    placeholder="Equipo"
                                    className="border p-2 rounded w-full"
                                    value={newProject.equipo || ''}
                                    onChange={(e) => setNewProject({ ...newProject, equipo: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Célula */}
                            <div className="space-y-2">
                                <input
                                    placeholder="Célula"
                                    className="border p-2 rounded w-full"
                                    value={newProject.celula || ''}
                                    onChange={(e) => setNewProject({ ...newProject, celula: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Horas */}
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    placeholder="Horas"
                                    className="border p-2 rounded w-full"
                                    value={newProject.horas || ''}
                                    onChange={(e) => setNewProject({ ...newProject, horas: parseInt(e.target.value) })}
                                    min="1"
                                    required
                                />
                            </div>

                            {/* Días (calculado automáticamente) */}
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    placeholder="Días"
                                    className="border p-2 rounded w-full bg-gray-100"
                                    value={newProject.dias || ''}
                                    readOnly
                                />
                                <p className="text-sm text-gray-500">Calculado automáticamente (9 horas = 1 día)</p>
                            </div>

                            {/* Fecha Entrega */}
                            <div className="space-y-2">
                                <input
                                    type="date"
                                    className="border p-2 rounded w-full"
                                    value={newProject.fechaEntrega ? new Date(newProject.fechaEntrega).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setNewProject({ ...newProject, fechaEntrega: new Date(e.target.value) })}
                                    required
                                />
                                <p className="text-sm text-gray-500">Fecha de entrega planificada</p>
                            </div>

                            {/* Fecha Real Entrega */}
                            <div className="space-y-2">
                                <input
                                    type="date"
                                    className="border p-2 rounded w-full"
                                    value={newProject.fechaRealEntrega ? new Date(newProject.fechaRealEntrega).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setNewProject({ ...newProject, fechaRealEntrega: new Date(e.target.value) })}
                                />
                                <p className="text-sm text-gray-500">Fecha real de entrega (opcional)</p>
                            </div>

                            {/* Fecha Certificación */}
                            <div className="space-y-2">
                                <input
                                    type="date"
                                    className="border p-2 rounded w-full"
                                    value={newProject.fechaCertificacion ? new Date(newProject.fechaCertificacion).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setNewProject({ ...newProject, fechaCertificacion: new Date(e.target.value) })}
                                />
                                <p className="text-sm text-gray-500">Fecha de certificación (opcional)</p>
                            </div>

                            {/* Días de Retraso (calculado automáticamente) */}
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    placeholder="Días de Retraso"
                                    className="border p-2 rounded w-full bg-gray-100"
                                    value={newProject.diasRetraso || 0}
                                    readOnly
                                />
                                <p className="text-sm text-gray-500">Calculado automáticamente al establecer la fecha real de entrega</p>
                            </div>

                            {/* Analista Producto */}
                            <div className="space-y-2">
                                <input
                                    placeholder="Analista de Producto"
                                    className="border p-2 rounded w-full"
                                    value={newProject.analistaProducto || ''}
                                    onChange={(e) => setNewProject({ ...newProject, analistaProducto: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Plan de Trabajo */}
                            <div className="space-y-2">
                                <textarea
                                    placeholder="Plan de Trabajo"
                                    className="border p-2 rounded w-full h-24"
                                    value={newProject.planTrabajo || ''}
                                    onChange={(e) => setNewProject({ ...newProject, planTrabajo: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingProject(null);
                                        setNewProject({});
                                    }}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    {editingProject ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Id Jira</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Proyecto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Equipo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Celula</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Horas</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Días</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">F. Entrega</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">R. Entrega</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">F. Certificación</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">D. Retraso</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Analista QA</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Plan de Trabajo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProjects.map((project, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2 text-sm font-medium text-blue-600 whitespace-nowrap">{project.idJira}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.proyecto}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.equipo}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.celula}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.horas}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.dias}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                    {new Date(project.fechaEntrega).toLocaleDateString('es-ES')}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                    {project.fechaRealEntrega && new Date(project.fechaRealEntrega).toLocaleDateString('es-ES')}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                    {project.fechaCertificacion && new Date(project.fechaCertificacion).toLocaleDateString('es-ES')}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.diasRetraso}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.analistaProducto}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{project.planTrabajo}</td>
                                <td className="px-4 py-2 text-sm whitespace-nowrap">
                                    <button
                                        onClick={() => {
                                            setEditingProject(project);
                                            setNewProject(project);
                                            setShowForm(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 mr-2"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project.idJira)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
