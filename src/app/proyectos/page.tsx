"use client";

import ProjectTable from '@/components/ProjectTable';

export default function ProyectosPage() {
    // Datos de ejemplo que simulan proyectos reales
    const proyectosEjemplo = [
        {
            idJira: 'KOIN256',
            proyecto: 'Koin Paquete 1 2025(Nuevo Koin (Paquete 5))',
            equipo: 'TechBridge',
            celula: 'SV',
            horas: 54,
            dias: 6.00,
            fechaEntrega: new Date('2025-03-12'),
            fechaRealEntrega: new Date('2025-03-19'),
            fechaCertificacion: new Date('2025-03-15'),
            diasRetraso: -45072,
            analistaProducto: 'Leidy Iral',
            planTrabajo: 'Plan 1'
        },
        {
            idJira: 'KOIN-256',
            proyecto: 'Koin Paquete 5 2025(KOIN-256)',
            equipo: 'TechBridge',
            celula: 'SV',
            horas: 54,
            dias: 6.00,
            fechaEntrega: new Date('2025-03-12'),
            fechaRealEntrega: new Date('2025-04-14'),
            fechaCertificacion: new Date('2025-03-20'),
            diasRetraso: -45072,
            analistaProducto: 'Leidy Iral',
            planTrabajo: 'Plan 2'
        },
        {
            idJira: 'SRCA-6450',
            proyecto: 'Prueba concepto montaje WAF',
            equipo: 'TechBridge',
            celula: 'Suramericana',
            horas: 0,
            dias: 0.00,
            fechaEntrega: new Date('2025-03-17'),
            fechaRealEntrega: new Date('2025-04-11'),
            fechaCertificacion: new Date('2025-03-25'),
            diasRetraso: -45077,
            analistaProducto: 'Sergio Anaya',
            planTrabajo: 'Plan 3'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Seguimiento de Proyectos
                        </h1>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={() => alert('Funcionalidad en desarrollo')}
                        >
                            Nuevo Proyecto
                        </button>
                    </div>
                    <ProjectTable projects={proyectosEjemplo} />
                </div>
            </div>
        </div>
    );
}
