import { IncidentTable } from '@/components/incidents/IncidentTable';

export default function IncidentsPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Sistema de Seguimiento de Incidentes</h1>
                <p className="text-gray-600">Gestión y seguimiento de incidencias y defectos</p>
            </div>
            
            <IncidentTable />
        </div>
    );
}
