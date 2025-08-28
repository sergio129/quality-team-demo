// src/components/ai/AITestCaseGeneratorDemo.tsx

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Sparkles, FileText, Target, BarChart3 } from 'lucide-react';
import { AITestCaseGeneratorService } from '@/services/aiTestCaseGeneratorService';
import { TestCase } from '@/models/TestCase';
import { CoverageReport } from '@/types/aiTestCaseGenerator';

interface AITestCaseGeneratorDemoProps {
  projectId?: string;
  onTestCasesGenerated?: (testCases: TestCase[]) => void;
}

export const AITestCaseGeneratorDemo: React.FC<AITestCaseGeneratorDemoProps> = ({
  projectId,
  onTestCasesGenerated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userStory, setUserStory] = useState('');
  const [requirements, setRequirements] = useState('');
  const [projectName, setProjectName] = useState('');
  const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([]);
  const [suggestedScenarios, setSuggestedScenarios] = useState<string[]>([]);
  const [coverageReport, setCoverageReport] = useState<CoverageReport | null>(null);

  // Método 1: Generar desde historia de usuario
  const handleGenerateFromUserStory = async () => {
    if (!userStory.trim()) {
      toast.error('Por favor ingresa una historia de usuario');
      return;
    }

    setIsLoading(true);
    try {
      const service = new AITestCaseGeneratorService();
      const testCases = await service.generateFromUserStory(userStory, {
        projectId,
        contextualInfo: `Proyecto: ${projectName || 'Proyecto sin nombre'}`
      });

      setGeneratedTestCases(testCases);
      onTestCasesGenerated?.(testCases);
      toast.success(`Generados ${testCases.length} casos de prueba`);
    } catch (error) {
      toast.error('Error generando casos de prueba');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Método 2: Generar desde requisitos
  const handleGenerateFromRequirements = async () => {
    if (!requirements.trim()) {
      toast.error('Por favor ingresa los requisitos');
      return;
    }

    setIsLoading(true);
    try {
      const requirementsList = requirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req.length > 0);

      const service = new AITestCaseGeneratorService();
      const testCases = await service.generateFromRequirements(requirementsList, {
        projectId,
        contextualInfo: `Proyecto: ${projectName || 'Proyecto sin nombre'}`
      });

      setGeneratedTestCases(testCases);
      onTestCasesGenerated?.(testCases);
      toast.success(`Generados ${testCases.length} casos de prueba`);
    } catch (error) {
      toast.error('Error generando casos de prueba');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Método 3: Sugerir escenarios
  const handleSuggestScenarios = async () => {
    if (!projectName.trim()) {
      toast.error('Por favor ingresa el nombre del proyecto');
      return;
    }

    setIsLoading(true);
    try {
      const service = new AITestCaseGeneratorService();
      const project = {
        id: projectId || 'demo-project',
        proyecto: projectName,
        descripcion: `Proyecto de demostración: ${projectName}`,
        // Propiedades requeridas mínimas
        idJira: 'DEMO-001',
        equipo: 'Demo Team',
        celula: 'Demo Cell',
        horas: 0,
        dias: 0,
        fechaEntrega: new Date(),
        diasRetraso: 0,
        analistaProducto: 'Demo Analyst',
        planTrabajo: 'Demo Plan'
      } as any; // Type assertion para evitar problemas de tipos

      const scenarios = await service.suggestTestScenarios(project);
      setSuggestedScenarios(scenarios);
      toast.success(`Generadas ${scenarios.length} sugerencias de escenarios`);
    } catch (error) {
      toast.error('Error generando sugerencias');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Método 4: Analizar cobertura
  const handleAnalyzeCoverage = async () => {
    if (!projectId) {
      toast.error('Se necesita un ID de proyecto para analizar cobertura');
      return;
    }

    setIsLoading(true);
    try {
      const service = new AITestCaseGeneratorService();
      const report = await service.analyzeTestCoverage(projectId, generatedTestCases);
      setCoverageReport(report);
      toast.success('Análisis de cobertura completado');
    } catch (error) {
      toast.error('Error analizando cobertura');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generador Inteligente de Casos de Prueba - Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user-story" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="user-story" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Historia Usuario
              </TabsTrigger>
              <TabsTrigger value="requirements" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Requisitos
              </TabsTrigger>
              <TabsTrigger value="scenarios" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Escenarios
              </TabsTrigger>
              <TabsTrigger value="coverage" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Cobertura
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Generar desde Historia de Usuario */}
            <TabsContent value="user-story" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Nombre del Proyecto</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Ingresa el nombre del proyecto"
                  />
                </div>
                <div>
                  <Label htmlFor="user-story">Historia de Usuario</Label>
                  <Textarea
                    id="user-story"
                    value={userStory}
                    onChange={(e) => setUserStory(e.target.value)}
                    placeholder="Como [usuario], quiero [funcionalidad] para [beneficio]..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleGenerateFromUserStory}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Generando...' : 'Generar Casos de Prueba'}
                </Button>
              </div>
            </TabsContent>

            {/* Tab 2: Generar desde Requisitos */}
            <TabsContent value="requirements" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name-req">Nombre del Proyecto</Label>
                  <Input
                    id="project-name-req"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Ingresa el nombre del proyecto"
                  />
                </div>
                <div>
                  <Label htmlFor="requirements">Requisitos (uno por línea)</Label>
                  <Textarea
                    id="requirements"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="El sistema debe permitir login
El sistema debe validar contraseñas
El sistema debe mostrar dashboard..."
                    rows={6}
                  />
                </div>
                <Button
                  onClick={handleGenerateFromRequirements}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Generando...' : 'Generar Casos de Prueba'}
                </Button>
              </div>
            </TabsContent>

            {/* Tab 3: Sugerir Escenarios */}
            <TabsContent value="scenarios" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name-scenarios">Nombre del Proyecto</Label>
                  <Input
                    id="project-name-scenarios"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Ingresa el nombre del proyecto"
                  />
                </div>
                <Button
                  onClick={handleSuggestScenarios}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Generando...' : 'Sugerir Escenarios'}
                </Button>

                {suggestedScenarios.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Escenarios Sugeridos:</h4>
                    <ul className="space-y-2">
                      {suggestedScenarios.map((scenario, index) => (
                        <li key={index} className="p-2 bg-gray-50 rounded">
                          {scenario}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab 4: Analizar Cobertura */}
            <TabsContent value="coverage" className="space-y-4">
              <div className="space-y-4">
                <Button
                  onClick={handleAnalyzeCoverage}
                  disabled={isLoading || !projectId}
                  className="w-full"
                >
                  {isLoading ? 'Analizando...' : 'Analizar Cobertura'}
                </Button>

                {coverageReport && (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-blue-50 rounded">
                      <h4 className="font-semibold">Cobertura Actual: {coverageReport.coveragePercentage}%</h4>
                    </div>

                    {coverageReport.missingScenarios.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Escenarios Faltantes:</h4>
                        <ul className="space-y-1">
                          {coverageReport.missingScenarios.map((scenario, index) => (
                            <li key={index} className="text-red-600">• {scenario}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {coverageReport.riskAreas.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Áreas de Riesgo:</h4>
                        <ul className="space-y-1">
                          {coverageReport.riskAreas.map((risk, index) => (
                            <li key={index} className="text-orange-600">• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {coverageReport.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Recomendaciones:</h4>
                        <ul className="space-y-1">
                          {coverageReport.recommendations.map((rec, index) => (
                            <li key={index} className="text-green-600">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Resultados de Casos de Prueba Generados */}
          {generatedTestCases.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Casos de Prueba Generados ({generatedTestCases.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {generatedTestCases.map((testCase, index) => (
                  <Card key={index} className="p-3">
                    <div className="font-medium">{testCase.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Tipo: {testCase.testType} | Prioridad: {testCase.priority}
                    </div>
                    <div className="text-sm mt-2">
                      <strong>Resultado esperado:</strong> {testCase.expectedResult}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
