'use client';

import { useState, useEffect } from 'react';
import { QAAnalyst, QARole } from '@/models/QAAnalyst';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useAnalystStats } from '@/hooks/useAnalystStats';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface AnalystPerformanceProps {
  analystId: string;
}

interface AnalystStats {
  incidentsCaught: number;
  incidentsResolved: number;
  avgResolutionTime: number;
  byPriority: { name: string; value: number }[];
  byType: { name: string; value: number }[];
  lastMonthActivity: { date: string; count: number }[];
  // Métricas adicionales para QA Leaders
  teamMetrics?: {
    teamSize: number;
    teamEfficiency: number;
    teamCoverage: number;
    membersPerformance: { name: string; performance: number }[];
  };
  leadershipMetrics?: {
    reviewsCompleted: number;
    trainingsLed: number;
    improvementProposals: number;
    processEfficiency: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AnalystPerformance({ analystId }: AnalystPerformanceProps) {
  const [analyst, setAnalyst] = useState<QAAnalyst | null>(null);
  const [stats, setStats] = useState<AnalystStats | null>(null);
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalyst = async () => {
      try {
        const response = await fetch(`/api/analysts/${analystId}`);
        if (response.ok) {
          const data = await response.json();
          setAnalyst(data);
        }
      } catch (error) {
        console.error('Error fetching analyst details:', error);
      }
    };

    fetchAnalyst();
  }, [analystId]);  const { stats: analystStats, isLoading: statsLoading } = useAnalystStats(analystId, timeFrame);
  
  useEffect(() => {
    if (analystStats) {
      setStats(analystStats);
      setLoading(false);
    } else {
      setLoading(statsLoading);
    }
  }, [analystStats, statsLoading]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
    };

    if (analystId && analyst) {
      fetchStats();
    }
  }, [analystId, timeFrame, analyst]);
  if (!analyst) {
    return <div>Cargando información del analista...</div>;
  }
  
  // Verificar si es un QA Leader para mostrar métricas específicas
  const isQALeader = analyst.role === 'QA Leader';
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isQALeader && (
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-medium">
              QA Leader
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Período:</span>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as 'week' | 'month' | 'year')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="year">Último año</option>
          </select>
        </div>
      </div>{loading ? (
        <div className="flex justify-center py-4">
          <span>Cargando estadísticas...</span>
        </div>
      ) : stats ? (
        <>          {/* Resumen de métricas clave */}
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="bg-blue-50 p-3 rounded-lg text-center w-32">
              <p className="text-xs text-gray-500">Incidentes reportados</p>
              <p className="text-xl font-bold text-blue-600">{stats.incidentsCaught}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center w-32">
              <p className="text-xs text-gray-500">Incidentes resueltos</p>
              <p className="text-xl font-bold text-green-600">{stats.incidentsResolved}</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-center w-32">
              <p className="text-xs text-gray-500">Tiempo medio (días)</p>
              <p className="text-xl font-bold text-amber-600">{stats.avgResolutionTime.toFixed(1)}</p>
            </div>
            
            {/* Métricas específicas para QA Leader */}
            {isQALeader && stats.leadershipMetrics && (
              <>
                <div className="bg-indigo-50 p-3 rounded-lg text-center w-32">
                  <p className="text-xs text-gray-500">Revisiones</p>
                  <p className="text-xl font-bold text-indigo-600">{stats.leadershipMetrics.reviewsCompleted}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center w-32">
                  <p className="text-xs text-gray-500">Capacitaciones</p>
                  <p className="text-xl font-bold text-purple-600">{stats.leadershipMetrics.trainingsLed}</p>
                </div>
                <div className="bg-pink-50 p-3 rounded-lg text-center w-32">
                  <p className="text-xs text-gray-500">Propuestas</p>
                  <p className="text-xl font-bold text-pink-600">{stats.leadershipMetrics.improvementProposals}</p>
                </div>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">          {/* Gráfico por prioridad */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-2">Incidentes por prioridad</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byPriority}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.byPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Gráfico por tipo de bug */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-2">Incidentes por tipo</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>{/* Gráfico actividad reciente */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-2">Actividad reciente</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.lastMonthActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>            </div>
          </Card>
          
          {/* Métricas específicas para QA Leader: Rendimiento del equipo */}
          {isQALeader && stats.teamMetrics && (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Rendimiento del equipo</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.teamMetrics.membersPerformance}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Rendimiento']} />
                    <Bar dataKey="performance" fill="#8884d8" barSize={20}>
                      {stats.teamMetrics.membersPerformance.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.performance > 75 ? '#00C49F' : entry.performance > 50 ? '#FFBB28' : '#FF8042'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-around mt-2 text-center">
                <div>
                  <div className="text-sm font-medium text-indigo-600">{stats.teamMetrics.teamSize}</div>
                  <div className="text-xs text-gray-500">Miembros</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-green-600">{stats.teamMetrics.teamEfficiency}%</div>
                  <div className="text-xs text-gray-500">Eficiencia</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-amber-600">{stats.teamMetrics.teamCoverage}%</div>
                  <div className="text-xs text-gray-500">Cobertura</div>
                </div>
              </div>
            </Card>
          )}
          
          {/* Eficiencia de proceso para QA Leaders */}
          {isQALeader && stats.leadershipMetrics && (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Eficiencia de procesos</h3>
              <div className="h-48 flex items-center justify-center">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={stats.leadershipMetrics.processEfficiency > 75 ? "#10b981" : "#f59e0b"}
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 45 * stats.leadershipMetrics.processEfficiency / 100} ${2 * Math.PI * 45 * (100 - stats.leadershipMetrics.processEfficiency) / 100}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    <text
                      x="50"
                      y="45"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="20"
                      fontWeight="bold"
                      fill="#374151"
                    >
                      {stats.leadershipMetrics.processEfficiency}%
                    </text>
                    <text
                      x="50"
                      y="65"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      Eficiencia
                    </text>
                  </svg>
                </div>
              </div>
            </Card>
          )}
        </div>
        </>
      ) : (
        <div className="text-center py-6">
          <p>No se encontraron estadísticas para este analista.</p>
        </div>
      )}
    </div>
  );
}
