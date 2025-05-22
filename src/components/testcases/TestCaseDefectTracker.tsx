'use client';

import { useState, useEffect } from 'react';
import { useTestCases } from '@/hooks/useTestCases';
import { Incident } from '@/models/Incident';
import { TestCase } from '@/models/TestCase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bug, AlertCircle, CheckCircle } from 'lucide-react';

interface TestCaseDefectTrackerProps {
  projectId?: string;
  testPlanId?: string;
}

export default function TestCaseDefectTracker({ projectId, testPlanId }: TestCaseDefectTrackerProps) {
  const { testCases } = useTestCases(projectId, testPlanId);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [defects, setDefects] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDefectDialogOpen, setIsDefectDialogOpen] = useState(false);
  
  // Filtrar solo los casos de prueba con defectos
  const casesWithDefects = testCases.filter(
    tc => tc.defects && tc.defects.length > 0
  ).sort((a, b) => b.defects.length - a.defects.length);
  
  // Agrupar por ciclo
  const cycleGroups = casesWithDefects.reduce((acc, tc) => {
    if (!acc[tc.cycle]) {
      acc[tc.cycle] = [];
    }
    acc[tc.cycle].push(tc);
    return acc;
  }, {} as Record<number, TestCase[]>);
  
  // Cargar defectos cuando se selecciona un caso de prueba
  useEffect(() => {
    if (selectedTestCase && selectedTestCase.defects && selectedTestCase.defects.length > 0) {
      loadDefectsForTestCase();
    }
  }, [selectedTestCase]);
  
  const loadDefectsForTestCase = async () => {
    if (!selectedTestCase) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/test-cases/defects?testCaseId=${selectedTestCase.id}`);
      if (response.ok) {
        const data = await response.json();
        setDefects(data);
      } else {
        console.error('Error loading defects');
        setDefects([]);
      }
    } catch (error) {
      console.error('Error loading defects:', error);
      setDefects([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calcular estadísticas de defectos
  const calcDefectStats = () => {
    const totalDefects = casesWithDefects.reduce(
      (sum, tc) => sum + tc.defects.length, 0
    );
    
    const defectsPerCycle = Object.keys(cycleGroups).map(cycle => {
      const casesInCycle = cycleGroups[Number(cycle)];
      const defectsInCycle = casesInCycle.reduce(
        (sum, tc) => sum + tc.defects.length, 0
      );
      return { cycle, count: defectsInCycle };
    }).sort((a, b) => Number(b.cycle) - Number(a.cycle));
    
    return {
      totalCases: testCases.length,
      casesWithDefects: casesWithDefects.length,
      totalDefects,
      defectsPerCycle
    };
  };
  
  const stats = calcDefectStats();
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Casos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Casos con Defectos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.casesWithDefects}</div>
            <p className="text-xs text-gray-500">
              {stats.totalCases > 0 
                ? `${((stats.casesWithDefects / stats.totalCases) * 100).toFixed(1)}%`
                : '0%'} de los casos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Defectos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.totalDefects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Último Ciclo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.defectsPerCycle.length > 0 
                ? `${stats.defectsPerCycle[0].count} defectos`
                : 'N/A'}
            </div>
            {stats.defectsPerCycle.length > 0 && (
              <p className="text-xs text-gray-500">Ciclo {stats.defectsPerCycle[0].cycle}</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ciclo</TableHead>
              <TableHead>Caso de Prueba</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Defectos</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(cycleGroups)
              .sort((a, b) => Number(b) - Number(a))
              .flatMap(cycle => 
                cycleGroups[Number(cycle)].map((testCase, idx) => (
                  <TableRow key={testCase.id}>
                    {idx === 0 && (
                      <TableCell rowSpan={cycleGroups[Number(cycle)].length} className="font-medium">
                        Ciclo {cycle}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium">{testCase.codeRef}</div>
                      <div className="text-sm text-gray-500">{testCase.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        testCase.status === 'Exitoso' ? 'bg-green-100 text-green-800' :
                        testCase.status === 'Fallido' ? 'bg-red-100 text-red-800' :
                        testCase.status === 'Bloqueado' ? 'bg-orange-100 text-orange-800' :
                        testCase.status === 'En progreso' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {testCase.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Bug className="h-4 w-4 text-red-500" />
                        <span>{testCase.defects.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTestCase(testCase);
                          setIsDefectDialogOpen(true);
                        }}
                      >
                        Ver Defectos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
            
            {casesWithDefects.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No hay casos de prueba con defectos registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {isDefectDialogOpen && selectedTestCase && (
        <Dialog open={isDefectDialogOpen} onOpenChange={setIsDefectDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Defectos del Caso {selectedTestCase.codeRef}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-sm text-gray-500">Nombre del Caso</div>
                    <div className="font-medium">{selectedTestCase.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Estado</div>
                    <div className="font-medium">{selectedTestCase.status}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Historia de Usuario</div>
                    <div className="font-medium">{selectedTestCase.userStoryId || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ciclo</div>
                    <div className="font-medium">{selectedTestCase.cycle}</div>
                  </div>
                </div>
              </div>
              
              <div className="text-lg font-medium mb-2">Lista de Defectos ({selectedTestCase.defects.length})</div>
              
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : defects.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Prioridad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defects.map(defect => (
                        <TableRow key={defect.id}>
                          <TableCell className="font-medium">
                            {defect.id}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {defect.descripcion}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              defect.estado.toLowerCase().includes('resuelto') || 
                              defect.estado.toLowerCase().includes('cerrado')
                                ? 'bg-green-100 text-green-800'
                                : defect.estado.toLowerCase().includes('abierto') ||
                                  defect.estado.toLowerCase().includes('en progreso')
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                            }>
                              {defect.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              defect.prioridad === 'Alta' ? 'border-red-500 text-red-500' :
                              defect.prioridad === 'Media' ? 'border-yellow-500 text-yellow-600' :
                              'border-blue-500 text-blue-500'
                            }>
                              {defect.prioridad}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-gray-50">
                  <AlertCircle className="h-8 w-8 text-orange-500 mb-2" />
                  <p className="text-gray-600">No se pudieron cargar los defectos para este caso de prueba.</p>
                  <p className="text-sm text-gray-500">Los IDs de defectos vinculados pueden no existir en el sistema.</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsDefectDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
