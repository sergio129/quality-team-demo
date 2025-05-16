'use client';

import { useState, useEffect } from 'react';
import { QAAnalyst } from '@/models/QAAnalyst';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
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
  }, [analystId]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analysts/${analystId}/stats?timeframe=${timeFrame}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching analyst stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (analystId) {
      fetchStats();
    }
  }, [analystId, timeFrame]);

  if (!analyst) {
    return <div>Cargando información del analista...</div>;
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
      </div>      {loading ? (
        <div className="flex justify-center py-4">
          <span>Cargando estadísticas...</span>
        </div>
      ) : stats ? (
        <>
          {/* Resumen de métricas clave */}
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
              </ResponsiveContainer>
            </div>
          </Card>
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
