"use client";

import ProjectTable from '@/components/ProjectTable';

export default function ProyectosPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[95%] mx-auto py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Seguimiento de Proyectos
                    </h1>
                </div>
                <ProjectTable />
            </div>
        </div>
    );
}
