'use client';

import { useState, useEffect } from 'react';
import { useTestCases, useTestPlans, calculateTestPlanQuality } from '@/hooks/useTestCases';
import { TestCase, TestPlan } from '@/models/TestCase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface TestCaseAdvancedStatsProps {
  projectId?: string;
}

export default function TestCaseAdvancedStats({ projectId }: TestCaseAdvancedStatsProps) {
  const { testCases } = useTestCases(projectId);
  const { testPlans } = useTestPlans(projectId);
  const [activeTab, setActiveTab] = useState('general');
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Asegurarnos de tener un ciclo seleccionado si hay casos de prueba
  useEffect(() => {
    if (testCases.length > 0) {
      const cycles = [...new Set(testCases.map(tc => tc.cycle))].sort();
      if (cycles.length > 0 && !selectedCycle) {
        setSelectedCycle(Math.max(...cycles));
      }
    }
  }, [testCases, selectedCycle]);
  
  // Estadísticas por estado para todos los casos o filtrados por ciclo
  const getStatusStats = () => {
    const filteredCases = selectedCycle 
      ? testCases.filter(tc => tc.cycle === selectedCycle)
      : testCases;
      
    const stats = filteredCases.reduce((acc, tc) => {
      acc[tc.status] = (acc[tc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  };
  
  // Estadísticas por tipo de prueba
  const getTypeStats = () => {
    const filteredCases = selectedCycle 
      ? testCases.filter(tc => tc.cycle === selectedCycle)
      : testCases;
      
    const stats = filteredCases.reduce((acc, tc) => {
      acc[tc.testType] = (acc[tc.testType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  };
  
  // Defectos por ciclo
  const getDefectsByCycle = () => {
    const cycles = [...new Set(testCases.map(tc => tc.cycle))].sort();
    
    return cycles.map(cycle => {
      const casesInCycle = testCases.filter(tc => tc.cycle === cycle);
      const totalDefects = casesInCycle.reduce((sum, tc) => sum + (tc.defects?.length || 0), 0);
      const totalCases = casesInCycle.length;
      
      return {
        name: `Ciclo ${cycle}`,
        defectos: totalDefects,
        casos: totalCases,
        ratio: totalCases ? Number((totalDefects / totalCases).toFixed(2)) : 0
      };
    });
  };
  
  // Progreso por plan de pruebas si hay uno seleccionado
  const getTestPlanProgress = () => {
    if (!selectedPlan) return [];
    
    const plan = testPlans.find(p => p.id === selectedPlan);
    if (!plan) return [];
    
    return plan.cycles.map(cycle => {
      const total = cycle.designed;
      const executed = cycle.successful + cycle.defects;
      const pending = cycle.notExecuted;
      
      return {
        name: `Ciclo ${cycle.number}`,
        ejecutados: executed,
        pendientes: pending,
        defectos: cycle.defects
      };
    });
  };
  
  // Colores para los gráficos
  const COLORS = {
    'Exitoso': '#10b981',
    'Fallido': '#ef4444',
    'No ejecutado': '#6b7280',
    'Bloqueado': '#f97316',
    'En progreso': '#3b82f6',
    'ejecutados': '#10b981',
    'pendientes': '#6b7280',
    'defectos': '#ef4444'
  };
  
  const CHART_COLORS = ['#10b981', '#ef4444', '#6b7280', '#f97316', '#3b82f6', '#8b5cf6', '#ec4899'];
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">Estadísticas Generales</TabsTrigger>
          <TabsTrigger value="cycles">Ciclos de Prueba</TabsTrigger>
          <TabsTrigger value="plans">Planes de Prueba</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Filtrar por Ciclo</label>
            <Select
              value={selectedCycle?.toString() || ''}
              onChange={(e) => setSelectedCycle(e.target.value ? parseInt(e.target.value) : null)}
              className="max-w-xs"
            >
              <option value="">Todos los ciclos</option>
              {[...new Set(testCases.map(tc => tc.cycle))].sort().map(cycle => (
                <option key={cycle} value={cycle}>Ciclo {cycle}</option>
              ))}
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Estado de los Casos de Prueba</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getStatusStats()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {getStatusStats().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[entry.name as keyof typeof COLORS] || CHART_COLORS[index % CHART_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`Casos: ${value}`, 'Cantidad']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo de Prueba</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getTypeStats()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`Casos: ${value}`, 'Cantidad']} />
                      <Legend />
                      <Bar dataKey="value" name="Cantidad" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="cycles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Defectos por Ciclo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDefectsByCycle()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="defectos" name="Defectos Encontrados" fill="#ef4444" />
                    <Bar yAxisId="left" dataKey="casos" name="Casos Ejecutados" fill="#10b981" />
                    <Bar yAxisId="right" dataKey="ratio" name="Ratio Defectos/Caso" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Calidad por Ciclo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDefectsByCycle()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ratio" name="Ratio Defectos/Caso" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plans" className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Seleccionar Plan de Pruebas</label>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  value={selectedPlan || ''}
                  onChange={(e) => setSelectedPlan(e.target.value || null)}
                  className="max-w-md"
                >
                  <option value="">Seleccionar un plan</option>
                  {testPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.projectName} - {plan.codeReference || 'Sin referencia'}
                    </option>
                  ))}
                </Select>
              </div>
              
              {selectedPlan && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      const quality = await calculateTestPlanQuality(selectedPlan);
                      toast.success(`Calidad recalculada: ${quality}%`);
                    } catch (error) {
                      toast.error('Error al recalcular la calidad del plan');
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Recalcular Calidad
                </Button>
              )}
            </div>
          </div>
          
          {selectedPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Progreso del Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getTestPlanProgress()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="ejecutados" name="Ejecutados" stackId="a" fill="#10b981" />
                        <Bar dataKey="pendientes" name="Pendientes" stackId="a" fill="#6b7280" />
                        <Bar dataKey="defectos" name="Defectos" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Calidad</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPlan && (() => {
                    const plan = testPlans.find(p => p.id === selectedPlan);
                    if (!plan) return <p>Plan no encontrado</p>;
                    
                    const totalCases = plan.totalCases || 0;
                    const currentCycle = plan.cycles[plan.cycles.length - 1];
                    const executedCases = currentCycle ? (currentCycle.successful + currentCycle.defects) : 0;
                    const progress = totalCases > 0 ? Math.round((executedCases / totalCases) * 100) : 0;
                    
                    return (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium">Datos Generales</h3>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="bg-gray-50 p-3 rounded-md">
                              <div className="text-sm text-gray-500">Proyecto</div>
                              <div className="font-medium">{plan.projectName}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <div className="text-sm text-gray-500">Referencia</div>
                              <div className="font-medium">{plan.codeReference || 'N/A'}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <div className="text-sm text-gray-500">Total de Casos</div>
                              <div className="font-medium">{totalCases}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <div className="text-sm text-gray-500">Ciclos</div>
                              <div className="font-medium">{plan.cycles.length}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium">Progreso Actual (Ciclo {currentCycle?.number || '?'})</h3>
                          <div className="mt-2">
                            <div className="flex justify-between mb-1">
                              <span>Progreso de Ejecución</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="bg-green-50 p-3 rounded-md">
                              <div className="text-sm text-gray-500">Exitosos</div>
                              <div className="font-medium text-green-600">
                                {currentCycle?.successful || 0}
                              </div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-md">
                              <div className="text-sm text-gray-500">Defectos</div>
                              <div className="font-medium text-red-600">
                                {currentCycle?.defects || 0}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <div className="text-sm text-gray-500">Pendientes</div>
                              <div className="font-medium">
                                {currentCycle?.notExecuted || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium">Calidad</h3>
                          <div className="mt-2">
                            <div className="flex justify-between mb-1">
                              <span>Índice de Calidad</span>
                              <span>{plan.testQuality}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  plan.testQuality >= 90 ? 'bg-green-600' :
                                  plan.testQuality >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${plan.testQuality}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Selecciona un plan de pruebas para ver las métricas detalladas
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
