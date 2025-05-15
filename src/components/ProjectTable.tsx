"use client";

import { Project } from '@/models/Project';
import { useState } from 'react';

export default function ProjectTable({ projects }: { projects: Project[] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = projects.filter(project => 
        project.idJira.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.analistaProducto.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Barra de búsqueda */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div className="flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar proyecto..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id Jira</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Celula</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Entrega</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R. Entrega</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Certificación</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D. Retraso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analista Producto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan de Trabajo</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProjects.map((project, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{project.idJira}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.proyecto}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.equipo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.celula}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.horas}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.dias}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.fechaEntrega.toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.fechaRealEntrega?.toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.fechaCertificacion?.toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.diasRetraso}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.analistaProducto}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.planTrabajo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
