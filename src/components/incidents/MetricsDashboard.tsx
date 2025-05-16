'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Incident } from '@/models/Incident';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Cell,
    CartesianGrid,
} from 'recharts';

interface MetricsProps {
    incidents: Incident[];
}

type TimeFilter = 'week' | 'month' | 'year';
type GroupBy = 'equipo' | 'celula';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const STATUS_COLORS = {
    'Abierto': '#ef4444',
    'En Progreso': '#eab308',
    'Resuelto': '#22c55e'
};

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

export function MetricsDashboard({ incidents }: MetricsProps) {
    const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
    const [bugTypeDistribution, setBugTypeDistribution] = useState<any[]>([]);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
    const [groupBy, setGroupBy] = useState<GroupBy>('equipo');
    const [teamDistribution, setTeamDistribution] = useState<any[]>([]);
    const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>(incidents);

    // Estado para equipos y células
    const [teams, setTeams] = useState<{id: string, name: string}[]>([]);
    const [cells, setCells] = useState<{id: string, name: string, teamId: string}[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedCell, setSelectedCell] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            // Cargar equipos
            const teamsResponse = await fetch('/api/teams');
            const teamsData = await teamsResponse.json();
            setTeams(teamsData);

            // Cargar células
            const cellsResponse = await fetch('/api/cells');
            const cellsData = await cellsResponse.json();
            setCells(cellsData);
        };

        fetchData();
    }, []);

    useEffect(() => {
        filterIncidents();
    }, [timeFilter, incidents, selectedTeam, selectedCell, teams, cells]);

    const filterIncidents = () => {
        let filtered = [...incidents];
        
        // Filtrar por período
        const now = new Date();
        const filterDate = new Date();
        
        switch (timeFilter) {
            case 'week':
                filterDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                filterDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                filterDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        
        filtered = filtered.filter(incident => {
            const fechaCreacion = new Date(incident.fechaCreacion);
            return fechaCreacion >= filterDate;
        });

        // Filtrar por equipo si se ha seleccionado uno
        if (selectedTeam) {
            if (selectedCell) {
                filtered = filtered.filter(incident => incident.celula === selectedCell);
            } else {
                const teamCells = cells.filter(cell => cell.teamId === selectedTeam).map(cell => cell.name);
                filtered = filtered.filter(incident => teamCells.includes(incident.celula));
            }
        }

        setFilteredIncidents(filtered);
        calculateMetrics(filtered);
    };

    const calculateMetrics = (filtered: Incident[]) => {
        // Distribución por estado
        const statusCount = filtered.reduce((acc: any, incident) => {
            acc[incident.estado] = (acc[incident.estado] || 0) + 1;
            return acc;
        }, {});

        setStatusDistribution(Object.entries(statusCount).map(([name, value]) => ({
            name,
            value
        })));

        // Distribución por tipo de bug
        const bugCount = filtered.reduce((acc: any, incident) => {
            if (incident.tipoBug) {
                acc[incident.tipoBug] = (acc[incident.tipoBug] || 0) + 1;
            }
            return acc;
        }, {});

        setBugTypeDistribution(Object.entries(bugCount).map(([name, value]) => ({
            name,
            value
        })));        // Distribución por equipo/célula
        const distribution = filtered.reduce((acc: any, incident) => {
            // Only attempt to map to teams if teams and cells data is available
            const key = groupBy === 'equipo' 
                ? (teams.length > 0 && cells.length > 0)
                  ? teams.find(t => 
                      cells.find(c => c.name === incident.celula)?.teamId === t.id
                    )?.name || 'Sin equipo'
                  : incident.celula // If teams or cells data isn't loaded yet, use celula instead
                : incident.celula;
            
            if (!key) return acc;
            
            if (!acc[key]) {
                acc[key] = { total: 0, byType: {} };
            }
            acc[key].total++;
            if (incident.tipoBug) {
                acc[key].byType[incident.tipoBug] = (acc[key].byType[incident.tipoBug] || 0) + 1;
            }
            return acc;
        }, {});

        const distributionData = Object.entries(distribution).map(([name, data]: [string, any]) => ({
            name,
            total: data.total,
            ...data.byType
        }));

        setTeamDistribution(distributionData);
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 mb-6">
                <Select
                    value={timeFilter}
                    onChange={e => setTimeFilter(e.target.value as TimeFilter)}
                    className="w-40"
                >
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mes</option>
                    <option value="year">Último Año</option>
                </Select>

                <Select
                    value={groupBy}
                    onChange={e => setGroupBy(e.target.value as GroupBy)}
                    className="w-40"
                >
                    <option value="equipo">Por Equipo</option>
                    <option value="celula">Por Célula</option>
                </Select>

                <Select
                    value={selectedTeam}
                    onChange={e => {
                        setSelectedTeam(e.target.value);
                        setSelectedCell('');
                    }}
                    className="w-40"
                >
                    <option value="">Todos los equipos</option>
                    {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </Select>

                {selectedTeam && (
                    <Select
                        value={selectedCell}
                        onChange={e => setSelectedCell(e.target.value)}
                        className="w-40"
                    >
                        <option value="">Todas las células</option>
                        {cells
                            .filter(cell => cell.teamId === selectedTeam)
                            .map(cell => (
                                <option key={cell.id} value={cell.name}>{cell.name}</option>
                            ))}
                    </Select>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* KPIs Principales */}
                <Card className="p-6 bg-white shadow-lg rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Resumen General</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600">Total de Incidentes</p>
                            <p className="text-2xl font-bold text-blue-600">{filteredIncidents.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Incidentes Abiertos</p>
                            <p className="text-2xl font-bold text-red-500">
                                {filteredIncidents.filter(i => i.estado === 'Abierto').length}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tasa de Resolución</p>
                            <p className="text-2xl font-bold text-green-500">
                                {Math.round((filteredIncidents.filter(i => i.estado === 'Resuelto').length / filteredIncidents.length) * 100)}%
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Distribución de Estados */}
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
                </Card>

                {/* Distribución por Tipo de Bug */}
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

            {/* Gráfico de Distribución por Equipo/Célula */}
            <Card className="p-6 bg-white shadow-lg rounded-lg col-span-full">
                <h3 className="text-lg font-semibold mb-4">
                    Distribución de Bugs {groupBy === 'equipo' ? 'por Equipo' : 'por Célula'}
                </h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teamDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                formatter={(value, name) => [value, name === 'total' ? 'Total' : name]}
                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                            <Legend />
                            {['UI', 'Funcional', 'Performance', 'Seguridad', 'Base de Datos', 'Integración', 'Otro'].map((type, index) => (
                                <Bar key={type} dataKey={type} stackId="a" fill={COLORS[index % COLORS.length]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}
