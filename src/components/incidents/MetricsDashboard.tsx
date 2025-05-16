'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Incident } from '@/models/Incident';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from 'recharts';

interface MetricsProps {
    incidents: Incident[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const STATUS_COLORS = {
    'Abierto': '#ef4444',
    'En Progreso': '#eab308',
    'Resuelto': '#22c55e'
};

// Componente personalizado para las etiquetas del gráfico de dona
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const sin = Math.sin(-midAngle * RADIAN);
    const cos = Math.cos(-midAngle * RADIAN);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <path
                d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
                stroke="#888"
                fill="none"
            />
            <circle cx={sx} cy={sy} r={2} fill="#888" stroke="none" />
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 12}
                y={ey}
                textAnchor={textAnchor}
                fill="#333333"
                fontSize="12"
                fontWeight="500"
            >
                {name} ({(percent * 100).toFixed(0)}%)
            </text>
        </g>
    );
};

export function MetricsDashboard({ incidents }: MetricsProps) {    const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
    const [bugTypeDistribution, setBugTypeDistribution] = useState<any[]>([]);

    useEffect(() => {
        calculateMetrics();
    }, [incidents]);

    const calculateMetrics = () => {
        // Distribución por estado
        const statusCount = incidents.reduce((acc: any, incident) => {
            acc[incident.estado] = (acc[incident.estado] || 0) + 1;
            return acc;
        }, {});

        setStatusDistribution(Object.entries(statusCount).map(([name, value]) => ({
            name,
            value
        })));

        // Distribución por tipo de bug
        const bugCount = incidents.reduce((acc: any, incident) => {
            if (incident.tipoBug) {
                acc[incident.tipoBug] = (acc[incident.tipoBug] || 0) + 1;
            }
            return acc;
        }, {});

        setBugTypeDistribution(Object.entries(bugCount).map(([name, value]) => ({
            name,
            value
        })));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* KPIs Principales */}
            <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Resumen General</h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600">Total de Incidentes</p>
                        <p className="text-2xl font-bold text-blue-600">{incidents.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Incidentes Abiertos</p>
                        <p className="text-2xl font-bold text-red-500">
                            {incidents.filter(i => i.estado === 'Abierto').length}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Tasa de Resolución</p>
                        <p className="text-2xl font-bold text-green-500">
                            {Math.round((incidents.filter(i => i.estado === 'Resuelto').length / incidents.length) * 100)}%
                        </p>
                    </div>
                </div>
            </Card>            {/* Distribución de Estados */}
            <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Distribución por Estado</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                labelLine={false}
                                label={renderCustomizedLabel}
                            >
                                {statusDistribution.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} 
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name) => [`${value} incidentes`, name]}
                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>            {/* Distribución por Tipo de Bug */}
            <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Distribución por Tipo de Bug</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={bugTypeDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                labelLine={false}
                                label={renderCustomizedLabel}
                            >
                                {bugTypeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name) => [`${value} incidentes`, name]}
                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}
