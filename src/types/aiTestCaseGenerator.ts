// src/types/aiTestCaseGenerator.ts

import { TestCase } from '@/models/TestCase';
import { Project } from '@/models/Project';

/**
 * Interfaz principal para el Generador Inteligente de Casos de Prueba
 * Define los métodos principales que debe implementar el servicio de IA
 */
export interface AITestCaseGenerator {
  // Generación automática desde historias de usuario
  generateFromUserStory(userStory: string, options?: GenerateOptions): Promise<TestCase[]>;

  // Generación desde requisitos funcionales
  generateFromRequirements(requirements: string[], options?: GenerateOptions): Promise<TestCase[]>;

  // Sugerencias de escenarios de prueba
  suggestTestScenarios(project: Project, options?: SuggestOptions): Promise<string[]>;

  // Análisis de cobertura de pruebas
  analyzeTestCoverage(projectId: string, existingTestCases?: TestCase[]): Promise<CoverageReport>;
}

/**
 * Opciones para generación de casos de prueba
 */
export interface GenerateOptions {
  projectId?: string;
  testPlanId?: string;
  cycleNumber?: number;
  contextualInfo?: string;
}

/**
 * Opciones para sugerencias de escenarios
 */
export interface SuggestOptions {
  contextualInfo?: string;
}

/**
 * Reporte de análisis de cobertura
 */
export interface CoverageReport {
  coveragePercentage: number;
  missingScenarios: string[];
  riskAreas: string[];
  recommendations: string[];
}

/**
 * Resultado de generación de casos de prueba
 */
export interface GenerationResult {
  success: boolean;
  data: TestCase[];
  error?: string;
  status?: {
    totalRequirements: number;
    processedRequirements: number;
    generatedCases: number;
  };
}

/**
 * Configuración del servicio de IA
 */
export interface AIServiceConfig {
  apiKey?: string;
  apiModel?: string;
  maxTokens?: number;
  apiEndpoint?: string;
  provider?: 'openai' | 'anthropic' | 'groq';
}
