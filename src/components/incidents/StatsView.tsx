import { IncidentStats } from '@/services/incidentService';

interface StatsViewProps {
    stats: IncidentStats;
}

export function StatsView({ stats }: StatsViewProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Resumen de Incidencias</h2>
            
            {/* Total de incidencias abiertas */}
            <div className="mb-8">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalAbiertas}</div>
                <div className="text-gray-600">Incidencias Abiertas</div>
            </div>

            {/* Distribución por prioridad */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Por Prioridad</h3>
                <div className="flex gap-4">
                    {/* Alta */}
                    <div className="flex-1 bg-red-100 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-700">{stats.totalPorPrioridad.Alta}</div>
                        <div className="text-red-600">Alta</div>
                    </div>
                    {/* Media */}
                    <div className="flex-1 bg-yellow-100 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-700">{stats.totalPorPrioridad.Media}</div>
                        <div className="text-yellow-600">Media</div>
                    </div>
                    {/* Baja */}
                    <div className="flex-1 bg-green-100 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">{stats.totalPorPrioridad.Baja}</div>
                        <div className="text-green-600">Baja</div>
                    </div>
                </div>
            </div>

            {/* Por cliente */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Incidentes por Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(stats.totalPorCliente).map(([cliente, total]) => (
                        <div key={cliente} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{cliente}</span>
                            <span className="text-lg font-semibold text-blue-600">{total}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
