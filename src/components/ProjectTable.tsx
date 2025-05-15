"use client";

import { Project } from '@/models/Project';
import { useState, useEffect } from 'react';

export default function ProjectTable() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newProject, setNewProject] = useState<Partial<Project>>({});

    useEffect(() => {
        loadProjects();
    }, []);

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
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                        <h2 className="text-xl font-bold mb-4">
                            {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                        </h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleSave(newProject as Project);
                        }}>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="ID Jira"
                                    className="border p-2 rounded"
                                    value={newProject.idJira || ''}
                                    onChange={e => setNewProject({...newProject, idJira: e.target.value})}
                                />
                                <input
                                    placeholder="Proyecto"
                                    className="border p-2 rounded"
                                    value={newProject.proyecto || ''}
                                    onChange={e => setNewProject({...newProject, proyecto: e.target.value})}
                                />
                                {/* Añade más campos según necesites */}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-200 rounded"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    Guardar
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
