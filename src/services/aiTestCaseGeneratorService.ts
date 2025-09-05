import { TestCase, TestStep } from '@/models/TestCase';
import { Project } from '@/models/Project';
import { v4 as uuidv4 } from 'uuid';
import { AITestCaseGenerator, CoverageReport, GenerateOptions, SuggestOptions } from '@/types/aiTestCaseGenerator';

// Define una interfaz para los datos extraídos del Excel
export interface ExcelRequirementData {
  userStoryId?: string;         // ID (ej. HU1, HU2, HU3)
  requirementName?: string;     // Descripción general de la historia
  description?: string;         // Descripción detallada
  acceptanceCriteria?: string[];// Criterios de aceptación generales
  functionalDescription?: string;// Descripción funcional adicional
  priority?: string;            // Alta, Media, Baja
  complexity?: string;          // Alta, Media, Baja
  preconditions?: string;       // Precondiciones para los casos de prueba
  testData?: string;            // Datos de prueba sugeridos

  // Nuevos campos basados en el formato de tabla de HU
  userRole?: string;            // Como un [Rol] (ej. Admin, Sistema)
  functionality?: string;       // Necesito [Característica/Funcionalidad]
  purpose?: string;             // Con la finalidad de [Razón/Resultado]
  scenarios?: Array<{
    number?: string;            // Número (#) de Escenario
    title?: string;             // Nombre o título Criterio de Aceptación
    context?: string;           // Contexto (condiciones previas)
    event?: string;             // Cuando [Evento] (acción desencadenante)
    expectedResult?: string;    // Espero que el sistema [Resultado/Comportamiento esperado]
    securityRelevant?: boolean; // ¿API Aplica para la seguridad? (SI/NO)
  }>;
}

// Interfaces para la nueva funcionalidad

/**
 * Servicio para generar casos de prueba utilizando IA
 *
 * Mejoras implementadas:
 * 1. Soporte para planes de prueba: Asociación directa de casos generados con planes de prueba específicos
 * 2. Extracción mejorada de requisitos: Mayor flexibilidad en la detección de formatos de Excel
 * 3. Parser de IA avanzado: Detección de diferentes formatos de respuesta y extracción robusta
 * 4. Información contextual: Posibilidad de enviar información adicional para mejorar la generación
 * 5. Extracción de precondiciones: Captura completa de información de casos, incluyendo precondiciones
 * 6. Nuevos métodos: generateFromUserStory, generateFromRequirements, suggestTestScenarios, analyzeTestCoverage
 */
export class AITestCaseGeneratorService implements AITestCaseGenerator {
  private apiKey: string;
  private apiEndpoint: string;
  private apiModel: string;
  private maxTokens: number;
  constructor(
    options?: {
      apiKey?: string;
      apiModel?: string;
      maxTokens?: number;
      apiEndpoint?: string;
    }
  ) {    // Configurar API key desde múltiples fuentes posibles (para compatibilidad con Vercel)
    this.apiKey = options?.apiKey ||
                  process.env.NEXT_PUBLIC_GROQ_API_KEY ||
                  process.env.GROQ_API_KEY || // Variable sin NEXT_PUBLIC para Vercel
                  process.env.NEXT_PUBLIC_OPENAI_API_KEY || // Fallback por si acaso
                  '';

    // Verificación crítica: Si no hay API key, mostrar error claro
    if (!this.apiKey || this.apiKey.trim() === '') {
      console.error('❌ ERROR CRÍTICO: No se ha configurado ninguna API key de Groq');
      console.error('❌ Variables de entorno verificadas:');
      console.error('   - NEXT_PUBLIC_GROQ_API_KEY:', process.env.NEXT_PUBLIC_GROQ_API_KEY ? 'Configurada' : 'NO CONFIGURADA');
      console.error('   - GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Configurada' : 'NO CONFIGURADA');
      console.error('   - NODE_ENV:', process.env.NODE_ENV);
      console.error('❌ INSTRUCCIONES: Configura NEXT_PUBLIC_GROQ_API_KEY en Vercel con tu API key de Groq');
      throw new Error('API key de Groq no configurada. Ve las instrucciones en los logs de error.');
    }

    // Detectar el tipo de API key para configurar el proveedor
    const isGroqKey = this.apiKey.startsWith('gsk_');

    // Configurar el modelo y endpoint para Groq
    if (isGroqKey) {
      this.apiModel = options?.apiModel || "gemma2-9b-it";
      this.apiEndpoint = options?.apiEndpoint || 'https://api.groq.com/openai/v1/chat/completions';
      console.log('✅ Utilizando API de Groq con modelo gemma2-9b-it');
    } else {
      // Fallback: intentar usar Groq si no hay API key configurada
      console.warn('❌ No se detectó API key de Groq válida. Configurando para usar Groq por defecto.');
      this.apiModel = "llama3-70b-8192";
      this.apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
      this.apiKey = ''; // Esto debería fallar y mostrar error claro
    }
    
    this.maxTokens = options?.maxTokens || 3000;
    console.log('API Key configurada correctamente'); // Log para confirmar que se configuró (solo primera parte para seguridad)
  }
  
  /**
   * Método estático para usar desde componentes
   */  
  static async generateTestCasesWithAI(
    requirements: ExcelRequirementData[], 
    options?: { 
      projectId?: string; 
      testPlanId?: string;
      cycleNumber?: number;
      contextualInfo?: string;
    }
  ): Promise<{ 
    success: boolean; 
    data: Partial<TestCase>[]; 
    error?: string;
    status?: {
      totalRequirements: number;
      processedRequirements: number;
      generatedCases: number;
    }
  }> {
    try {
      const service = new AITestCaseGeneratorService();
      
      // Verificación crítica: Validar que la API key esté configurada antes de procesar
      if (!service.apiKey || service.apiKey.trim() === '') {
        return {
          success: false,
          data: [],
          error: 'API key de Groq no configurada. Configura NEXT_PUBLIC_GROQ_API_KEY en Vercel.',
          status: {
            totalRequirements: requirements?.length || 0,
            processedRequirements: 0,
            generatedCases: 0
          }
        };
      }
      
      // Validar que hay requisitos para procesar
      if (!requirements || requirements.length === 0) {
        return {
          success: false,
          data: [],
          error: 'No se proporcionaron requisitos para generar casos de prueba',
          status: {
            totalRequirements: 0,
            processedRequirements: 0,
            generatedCases: 0
          }
        };
      }
      
      // Filtrar requisitos válidos (con nombre o descripción)
      const validRequirements = requirements.filter(req => 
        (req.requirementName && req.requirementName.trim()) || 
        (req.description && req.description.trim())
      );
      
      if (validRequirements.length === 0) {
        return {
          success: false,
          data: [],
          error: 'No se encontraron requisitos válidos para generar casos de prueba',
          status: {
            totalRequirements: requirements.length,
            processedRequirements: 0,
            generatedCases: 0
          }
        };
      }
      
      // Usar el ID proporcionado o extraerlo del primer requisito, o generar uno nuevo
      const projectId = options?.projectId || 
                        (validRequirements[0].userStoryId ? validRequirements[0].userStoryId.split('-')[0] : '') || 
                        uuidv4();
      
      // Ciclo por defecto es 1
      const cycleNumber = options?.cycleNumber || 1;
      
      // Generar los casos de prueba con información de contexto adicional
      const testCases = await service.generateTestCases(
        projectId, 
        validRequirements, 
        cycleNumber,
        options?.testPlanId,
        options?.contextualInfo
      );
      
      // Retornar con información de estado del proceso
      return {
        success: true,
        data: testCases,
        status: {
          totalRequirements: requirements.length,
          processedRequirements: validRequirements.length,
          generatedCases: testCases.length
        }
      };
    } catch (error) {
      console.error('Error in generateTestCasesWithAI:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Error desconocido',
        status: {
          totalRequirements: requirements?.length || 0,
          processedRequirements: 0,
          generatedCases: 0
        }
      };
    }
  }
  /**
   * Genera casos de prueba basados en los datos extraídos del Excel
   */
  public async generateTestCases(
    projectId: string,
    requirements: ExcelRequirementData[],
    cycleNumber: number = 1,
    testPlanId?: string,
    contextualInfo?: string
  ): Promise<Partial<TestCase>[]> {
    try {
      const generatedTestCases: Partial<TestCase>[] = [];

      // Validar cada requisito antes de procesarlo
      const validatedRequirements = requirements.filter(req => {
        // Validación básica: debe tener al menos un nombre o descripción
        const isValid = Boolean(
          (req.requirementName && req.requirementName.trim()) || 
          (req.description && req.description.trim())
        );
        
        if (!isValid) {
          console.warn('Skipping invalid requirement without name or description', req);
        }
        
        return isValid;
      });
      
      if (validatedRequirements.length === 0) {
        console.warn('No valid requirements found to process');
        return [];
      }

      // Procesar cada requisito o historia de usuario validado
      console.log(`📊 Procesando ${validatedRequirements.length} requisitos con IA...`);

      for (let i = 0; i < validatedRequirements.length; i++) {
        const req = validatedRequirements[i];

        try {
          console.log(`🔄 Procesando requisito ${i + 1}/${validatedRequirements.length}: ${req.requirementName || req.userStoryId || 'Sin nombre'}`);

          // Enriquecemos el requisito si falta información
          this.enrichRequirement(req);

          // Creamos el prompt para la IA, incluyendo información contextual
          const prompt = this.createPrompt(req, contextualInfo);

          // Llamamos a la API de Groq
          const response = await this.callAIAPI(prompt);

          // Convertimos la respuesta de la IA en casos de prueba estructurados
          const testCases = this.parseAIResponse(response, projectId, req.userStoryId || '', cycleNumber);

          // Si hay un plan de pruebas, lo asociamos a cada caso
          if (testPlanId) {
            testCases.forEach(tc => {
              tc.testPlanId = testPlanId;
            });
          }

          generatedTestCases.push(...testCases);
          console.log(`✅ Requisito ${i + 1} completado: ${testCases.length} casos generados`);

          // Agregar delay entre requisitos para evitar rate limiting
          // Solo agregar delay si no es el último requisito
          if (i < validatedRequirements.length - 1) {
            const delayMs = 5000; // 5 segundos entre requisitos
            console.log(`⏳ Esperando ${delayMs/1000} segundos antes del siguiente requisito... (${i + 1}/${validatedRequirements.length})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        } catch (reqError) {
          console.error(`❌ Error procesando requisito ${i + 1}: ${req.requirementName}`, reqError);
          // Continuamos con el siguiente requisito si hay error en el actual
          continue;
        }
      }

      console.log(`🎉 Procesamiento completado: ${generatedTestCases.length} casos de prueba generados de ${validatedRequirements.length} requisitos`);      return generatedTestCases;
    } catch (error) {
      console.error('Error generating test cases with AI:', error);
      throw new Error('No se pudieron generar los casos de prueba con IA');
    }
  }
    /**
   * Enriquece un requisito con información deducida si falta algún campo
   */  private enrichRequirement(requirement: ExcelRequirementData): void {
    // Si no hay ID de historia de usuario, intentar extraerlo del nombre o descripción
    if (!requirement.userStoryId || !requirement.userStoryId.trim()) {
      const nameDesc = `${requirement.requirementName || ''} ${requirement.description || ''}`;
      
      // Buscar diferentes patrones de IDs de historias de usuario
      const patterns = [
        { regex: /\b(?:US|HU|HU1|US1|HU\d+|US\d+)\b/i, type: 'standard' },  // HU1, US1, HU123, US123
        { regex: /\b[A-Z]{2,}-\d+\b/g, type: 'dashed' },  // AB-123, XY-456
        { regex: /\b[A-Z]{3,}\d+\b/g, type: 'alphanumeric' },   // ABC123, XYZ456
        { regex: /\b\d{1,3}\b/g, type: 'numbers' }         // Solo números (como último recurso)
      ];
      
      let foundId = null;
      for (const pattern of patterns) {
        const match = nameDesc.match(pattern.regex);
        if (match) {
          // Para el último patrón (solo números), ser más específico
          if (pattern.type === 'numbers') {
            // Solo usar números si están precedidos por HU, US, o similar
            const contextMatch = nameDesc.match(/\b(?:HU|US|Historia|User Story)[\s:]*(\d{1,3})\b/i);
            if (contextMatch) {
              foundId = `HU${contextMatch[1]}`;
              break;
            }
          } else {
            foundId = match[0];
            break;
          }
        }
      }
      
      if (foundId) {
        requirement.userStoryId = foundId;
        console.log(`✅ ID de historia de usuario extraído: ${foundId}`);
      } else {
        // Generar un ID más legible si no se encuentra ninguno
        const timestamp = Date.now();
        const shortId = timestamp.toString().slice(-4); // Últimos 4 dígitos
        requirement.userStoryId = `HU-${shortId}`;
        console.log(`🔄 ID de historia de usuario generado: ${requirement.userStoryId}`);
      }
    }
    
    // Procesamiento para el formato de historias de usuario en forma de tabla
    // Si tenemos rol, funcionalidad y propósito pero no hay requirementName, construirlo en formato Gherkin
    if (requirement.userRole && requirement.functionality && requirement.purpose && !requirement.requirementName) {
      requirement.requirementName = `Como ${requirement.userRole} necesito ${requirement.functionality} con la finalidad de ${requirement.purpose}`;
    }    // Si el formato del requisito no tiene información desglosada pero tenemos una descripción,
    // intentar extraer el formato "Como... necesito... con la finalidad de..."
    if (!requirement.userRole && !requirement.functionality && !requirement.purpose && requirement.description) {
      const asAMatch = requirement.description.match(/(?:Como|En mi rol de)(.*?)(?:necesito|quiero|debo)(.*?)(?:con la finalidad de|para|con el fin de)(.*?)(?:$|\n)/i);
      if (asAMatch && asAMatch.length >= 4) {
        requirement.userRole = asAMatch[1].trim();
        requirement.functionality = asAMatch[2].trim();
        requirement.purpose = asAMatch[3].trim();
        
        // Si no hay nombre de requisito, crearlo
        if (!requirement.requirementName) {
          requirement.requirementName = `Como ${requirement.userRole} necesito ${requirement.functionality} con la finalidad de ${requirement.purpose}`;
        }
      }
    }
    
    // Procesamiento de escenarios estructurados según el formato de tabla
    // Si no tenemos escenarios pero tenemos criterios de aceptación, intentar extraer escenarios de ellos
    if ((!requirement.scenarios || requirement.scenarios.length === 0) && 
        requirement.acceptanceCriteria && requirement.acceptanceCriteria.length > 0) {
      
      requirement.scenarios = requirement.acceptanceCriteria.map((criterio, index) => {        // Intentar extraer partes del criterio de aceptación en formato Gherkin
        const gherkinMatch = criterio.match(
          /(?:Dado que|Dado|Given)(.*?)(?:Cuando|Cuando se|When)(.*?)(?:Entonces|Espero que|Then)(.*?)$/i
        );
        
        if (gherkinMatch && gherkinMatch.length >= 4) {
          return {
            number: String(index + 1),
            title: `Escenario ${index + 1}`,
            context: gherkinMatch[1].trim(),
            event: gherkinMatch[2].trim(),
            expectedResult: gherkinMatch[3].trim(),
            securityRelevant: criterio.toLowerCase().includes('seguridad') || 
                              criterio.toLowerCase().includes('security')
          };
        }
        
        // Si no está en formato Gherkin, crear un escenario básico
        return {
          number: String(index + 1),
          title: `Criterio de Aceptación ${index + 1}`,
          context: '',
          event: '',
          expectedResult: criterio.trim(),
          securityRelevant: criterio.toLowerCase().includes('seguridad') || 
                            criterio.toLowerCase().includes('security')
        };
      });
    }
    
    // Si tenemos escenarios pero no están bien estructurados, asegurarse de que tengan todos los campos
    if (requirement.scenarios && requirement.scenarios.length > 0) {
      requirement.scenarios = requirement.scenarios.map((scenario, index) => {
        // Garantizar que cada escenario tenga un número
        if (!scenario.number) {
          scenario.number = String(index + 1);
        }
        
        // Garantizar que cada escenario tenga un título
        if (!scenario.title) {
          scenario.title = `Escenario ${scenario.number}`;
        }
        
        // Si hay un título pero no hay evento ni resultado esperado, intentar extraer el formato Gherkin
        if (scenario.title && (!scenario.event || !scenario.expectedResult)) {          const gherkinMatch = scenario.title.match(
            /(?:Dado que|Dado|Given)?(.*?)(?:Cuando|Cuando se|When)?(.*?)(?:Entonces|Espero que|Then)?(.*?)$/i
          );
          
          if (gherkinMatch) {
            // Solo usar estos valores si no hay valores existentes
            if (!scenario.context) scenario.context = (gherkinMatch[1] || '').trim();
            if (!scenario.event) scenario.event = (gherkinMatch[2] || '').trim();
            if (!scenario.expectedResult) scenario.expectedResult = (gherkinMatch[3] || '').trim();
          }
        }
        
        // Valor por defecto para securityRelevant si no está definido
        if (scenario.securityRelevant === undefined) {
          scenario.securityRelevant = 
            (scenario.title?.toLowerCase().includes('seguridad') || 
             scenario.expectedResult?.toLowerCase().includes('seguridad') ||
             scenario.title?.toLowerCase().includes('security') || 
             scenario.expectedResult?.toLowerCase().includes('security')) || false;
        }
        
        return scenario;
      });
    }
    
    // Si tenemos escenarios, convertirlos a criterios de aceptación si no están presentes
    if (requirement.scenarios && requirement.scenarios.length > 0 && 
        (!requirement.acceptanceCriteria || requirement.acceptanceCriteria.length === 0)) {
      
      requirement.acceptanceCriteria = requirement.scenarios.map(s => {
        let criterio = '';
        if (s.title && !s.title.includes('Escenario')) criterio += `${s.title}: `;
        if (s.context) criterio += `Dado que ${s.context} `;
        if (s.event) criterio += `Cuando ${s.event} `;
        if (s.expectedResult) criterio += `Entonces ${s.expectedResult}`;
        return criterio.trim() || `Escenario #${s.number || '?'}: ${s.title || 'No especificado'}`;
      });
    }
    
    // Si no hay criterios de aceptación pero hay descripción, intentar extraerlos
    if ((!requirement.acceptanceCriteria || requirement.acceptanceCriteria.length === 0) && 
        !requirement.scenarios && requirement.description) {
      const desc = requirement.description;
      
      // Buscar secciones que podrían ser criterios de aceptación
      if (desc.includes('Criterios') || desc.includes('Cuando') || desc.includes('Dado que')) {
        const criteria = desc.split(/\n/).filter(line => 
          line.match(/^[-*•]|^\d+[\.\)]|^Cuando|^Dado|^Entonces|^Given|^When|^Then/i)
        );
        
        if (criteria.length > 0) {
          requirement.acceptanceCriteria = criteria.map(c => c.trim());
        }
      }
    }
    
    // Si el nombre es demasiado largo, acortarlo y mover el resto a la descripción
    if (requirement.requirementName && requirement.requirementName.length > 100) {
      const originalName = requirement.requirementName;
      requirement.requirementName = originalName.substring(0, 97) + '...';
      requirement.description = `${originalName}\n\n${requirement.description || ''}`;
    }

    // Si hay escenarios con contexto, extraer precondiciones
    if (requirement.scenarios && requirement.scenarios.length > 0 && !requirement.preconditions) {
      const contextDescriptions = requirement.scenarios
        .filter(s => s.context && s.context.trim())
        .map(s => s.context);
      
      if (contextDescriptions.length > 0) {
        requirement.preconditions = contextDescriptions.join('; ');
      }
    }

    // Extraer prioridad del texto si no está especificada
    if (!requirement.priority && requirement.description) {
      const priorityMatch = requirement.description.match(/\b(prioridad|priority|importancia):\s*(alta|media|baja|high|medium|low|crítica|critical)\b/i);
      if (priorityMatch) {
        const priority = priorityMatch[2].toLowerCase();
        if (priority.includes('alta') || priority.includes('high') || priority.includes('crítica')) {
          requirement.priority = 'Alta';
        } else if (priority.includes('media') || priority.includes('medium')) {
          requirement.priority = 'Media';
        } else if (priority.includes('baja') || priority.includes('low')) {
          requirement.priority = 'Baja';
        }
      }
    }

    // Extraer complejidad del texto si no está especificada
    if (!requirement.complexity && requirement.description) {
      const complexityMatch = requirement.description.match(/\b(complejidad|complexity|dificultad):\s*(alta|media|baja|high|medium|low|compleja|complex|simple)\b/i);
      if (complexityMatch) {
        const complexity = complexityMatch[2].toLowerCase();
        if (complexity.includes('alta') || complexity.includes('high') || complexity.includes('compleja')) {
          requirement.complexity = 'Alta';
        } else if (complexity.includes('media') || complexity.includes('medium')) {
          requirement.complexity = 'Media';
        } else if (complexity.includes('baja') || complexity.includes('low') || complexity.includes('simple')) {
          requirement.complexity = 'Baja';
        }
      }
    }
    
    // Extraer precondiciones de la descripción si aún no están especificadas
    if (!requirement.preconditions && requirement.description) {
      const preconditionsMatch = requirement.description.match(/\b(precondiciones|precondition|prerequisites|condiciones previas):\s*([^\n]+)/i);
      if (preconditionsMatch) {
        requirement.preconditions = preconditionsMatch[2].trim();
      }
    }
    
    // Extraer datos de prueba de la descripción si no están especificados
    if (!requirement.testData && requirement.description) {
      const testDataMatch = requirement.description.match(/\b(datos de prueba|test data|data|ejemplos):\s*([^\n]+)/i);
      if (testDataMatch) {
        requirement.testData = testDataMatch[2].trim();
      }
    }
  }
  
  /**
   * Crea el prompt para la IA basado en los datos del requisito
   */  private createPrompt(requirement: ExcelRequirementData, contextualInfo?: string): string {
    // Construimos un prompt detallado para obtener mejores resultados
    let prompt = `Como experto en pruebas de software, genera entre 3 y 5 casos de prueba completos y detallados que cubran todos los aspectos del requisito.

CRÍTICO: Los nombres de los casos de prueba DEBEN ser específicos y descriptivos. NO uses nombres genéricos.

Para cada caso de prueba incluye:

1. ID del caso de prueba (formato: ${requirement.userStoryId || 'HU'}-TC-###, donde ### es un número secuencial empezando en 01)
2. Nombre del caso de prueba (MÁXIMA PRIORIDAD: Debe ser específico y descriptivo, máximo 100 caracteres. OBLIGATORIO usar nombres como:
   - Para HU1 (campos en Jasper): "Validar creación de campos Monto, Plazo y Producto en informe Jasper"
   - Para HU2 (ingresos mensuales): "Verificar validación de formato numérico en campos de ingresos mensuales"
   - Para HU2 (ingresos anuales): "Comprobar formato de moneda en ingresos anuales con mínimo 7 caracteres"
   - Para cualquier HU de informes: "Probar descarga de informe con filtros aplicados correctamente"
   - Para cualquier HU de CRM: "Validar configuración de campos obligatorios en formulario del CRM"
   NUNCA uses: "Caso de prueba 1", "s y tipos de datos", "Verificar funcionalidad", etc.)
3. Tipo de prueba (Funcional, No Funcional, Regresión, Exploratoria, Integración, Rendimiento, Seguridad)
4. Prioridad (Alta, Media, Baja)
5. Precondiciones necesarias (estado del sistema antes de iniciar la prueba)
6. Pasos detallados (numerados, claros y específicos, con un máximo de 10 pasos)
7. Resultado esperado para cada caso (detallado y verificable)

REGLAS ESTRICTAS PARA NOMBRES:
- ANALIZA la descripción de la HU y extrae las palabras clave más importantes
- Usa verbos específicos: "Validar", "Verificar", "Comprobar", "Probar", "Confirmar"
- Incluye los elementos específicos mencionados en la HU (nombres de campos, informes, funcionalidades)
- Si es sobre campos: menciona cuáles campos específicos
- Si es sobre informes: menciona el tipo de informe (Jasper, etc.)
- Si es sobre CRM: menciona la funcionalidad específica del CRM
- Si es sobre validaciones: menciona qué tipo de validación
- Ejemplos PERFECTOS basados en HU reales:
  * HU1: "Validar visualización de campos Monto, Plazo y Producto en informe Jasper"
  * HU1: "Confirmar descarga de informe de entrevista con tres campos nuevos"
  * HU2: "Verificar validación de mínimo 7 caracteres en ingresos mensuales"
  * HU2: "Comprobar formato de moneda en campo ingresos anuales del CRM"
  * HU2: "Probar obligatoriedad de campos de ingresos en formulario de venta"

Asegúrate de cubrir los siguientes tipos de pruebas:
- Happy path (flujo normal/exitoso)
- Casos negativos/alternativos (manejo de errores, entradas inválidas)
- Casos límite (valores extremos o condiciones de borde)
- Validaciones de UI cuando corresponda

Los casos deben ser realistas, detallados y enfocados en verificar la funcionalidad descrita, no en aspectos técnicos de implementación. Los pasos deben ser claros para que cualquier tester pueda seguirlos sin conocimientos técnicos adicionales.

Estructura cada caso de prueba claramente con encabezados para facilitar su lectura y procesamiento.

IMPORTANTE: El nombre del caso debe ser lo suficientemente específico para que cualquier persona pueda entender exactamente qué funcionalidad se está probando sin leer la descripción completa.

DATOS DEL REQUISITO A PROBAR:

Historia/Requisito: ${requirement.requirementName || 'No especificado'}

ID de Historia de Usuario: ${requirement.userStoryId || 'No especificado'}

${requirement.userRole ? `Rol de Usuario: ${requirement.userRole}` : ''}
${requirement.functionality ? `Funcionalidad: ${requirement.functionality}` : ''}
${requirement.purpose ? `Propósito/Finalidad: ${requirement.purpose}` : ''}

Descripción: ${requirement.description || 'No hay descripción disponible'}

${requirement.functionalDescription ? `Descripción funcional: ${requirement.functionalDescription}` : ''}

${requirement.priority ? `Prioridad: ${requirement.priority}` : ''}

${requirement.complexity ? `Complejidad: ${requirement.complexity}` : ''}

${requirement.preconditions ? `Precondiciones: ${requirement.preconditions}` : ''}

${requirement.testData ? `Datos de prueba: ${requirement.testData}` : ''}

${requirement.acceptanceCriteria && requirement.acceptanceCriteria.length > 0 
  ? `Criterios de aceptación:\n${requirement.acceptanceCriteria.map(c => `- ${c}`).join('\n')}` 
  : ''}

${requirement.scenarios && requirement.scenarios.length > 0 
  ? `\nEscenarios/Criterios de Aceptación detallados:
${requirement.scenarios.map(s => `
#${s.number || ''}: ${s.title || ''}
- Contexto: ${s.context || 'No especificado'}
- Evento: ${s.event || 'No especificado'}
- Resultado Esperado: ${s.expectedResult || 'No especificado'}
${s.securityRelevant ? '- Relevante para seguridad: SÍ' : ''}
`).join('\n')}`
  : ''}

${contextualInfo ? `\nInformación contextual adicional:\n${contextualInfo}\n` : ''}`;

    return prompt;
  }  /**
   * Llama a la API de Groq para generar los casos de prueba
   */
  private async callAIAPI(prompt: string, retryCount = 0): Promise<string> {
    try {
      // Verificar que la clave API esté definida
      if (!this.apiKey || this.apiKey.trim() === '') {
        console.error('❌ ERROR: Intento de llamada a API sin API key configurada');
        console.error('❌ Asegúrate de configurar NEXT_PUBLIC_GROQ_API_KEY en Vercel');
        throw new Error('API key de Groq no configurada. Configura NEXT_PUBLIC_GROQ_API_KEY en Vercel.');
      }

      // Identificar el tipo de proveedor según el formato de la API key
      const isGroqKey = this.apiKey.startsWith('gsk_');
      
      let providerName = isGroqKey ? 'Groq' : 'Desconocido';
      console.log(`Preparando llamada a la API de ${providerName}...`);
      
      // Headers para Groq
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey.trim()}`
      };
      
      let requestBody;
      
      // Construir el cuerpo de la solicitud para Groq
      if (isGroqKey) {
        // Formato para Groq API
        requestBody = {
          model: this.apiModel,
          messages: [
            {
              role: "system",
              content: "Eres un experto en pruebas de software especializado en crear casos de prueba detallados y exhaustivos para aseguramiento de calidad. Tus casos deben ser claros, seguir un formato consistente y cubrir todas las funcionalidades y escenarios."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.5,  // Un poco más determinista para casos de prueba
          max_tokens: this.maxTokens
        };
      } else {
        throw new Error('Solo se soporta API key de Groq (debe comenzar con "gsk_")');
      }
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        // Leer el cuerpo de respuesta para obtener detalles del error
        const errorData = await response.text();        // Determinar el nombre del proveedor para mensajes de error
        const providerName = isGroqKey ? 'Groq' : 'Desconocido';
        console.error(`Error respuesta ${providerName}:`, response.status, errorData);
        
        // Mostrar información detallada sobre errores de autorización
        if (response.status === 401) {
          console.error('Error de autenticación: La API key no es válida o está mal configurada:', 
            this.apiKey ? `API key configurada (primeros 5 caracteres): ${this.apiKey.substring(0, 5)}...` : 'API key no definida');
          throw new Error(`Error de autenticación: La API key de ${providerName} no es válida o ha expirado. Verifica que uses una API key de Groq (comienza con "gsk_").`);
        }
        
        // Si es un error de límite de tasa o tiempo de espera, intentar de nuevo
        if ((response.status === 429 || response.status === 500 || response.status === 503) && retryCount < 3) {
          let waitTime: number;

          if (response.status === 429) {
            // Para rate limits, extraer el tiempo recomendado del mensaje de error
            const errorObj = JSON.parse(errorData);
            const retryMatch = errorData.match(/try again in (\d+\.?\d*)s/i);
            if (retryMatch) {
              waitTime = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1000; // Agregar 1 segundo extra
              console.log(`Rate limit alcanzado. Esperando ${waitTime/1000} segundos según recomendación de la API...`);
            } else {
              // Fallback: usar backoff exponencial más agresivo para rate limits
              waitTime = Math.pow(2, retryCount) * 3000; // 3s, 6s, 12s
              console.log(`Rate limit alcanzado. Reintentando en ${waitTime/1000} segundos...`);
            }
          } else {
            // Para otros errores, usar backoff exponencial normal
            waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            console.log(`Error temporal. Reintentando en ${waitTime/1000} segundos...`);
          }

          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.callAIAPI(prompt, retryCount + 1);
        }
        
        throw new Error(`Error en la llamada a la API de ${providerName}: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const data = await response.json();

      // Verificar que la respuesta tenga el formato esperado
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ Respuesta inesperada de la API:', data);
        console.error('❌ Estructura de respuesta:', {
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length,
          hasMessage: !!data.choices?.[0]?.message,
          messageContent: data.choices?.[0]?.message?.content
        });
        throw new Error('La respuesta de la API no tiene el formato esperado');
      }

      const aiResponse = data.choices[0].message.content || '';
      return aiResponse;
    } catch (error) {
      console.error('Error calling AI API:', error);
      
      // Reintentar en caso de errores de red o temporales
      if (error instanceof Error && 
          (error.message.includes('network') || error.message.includes('timeout')) && 
          retryCount < 3) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Error de red/timeout. Reintentando en ${waitTime/1000} segundos...`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.callAIAPI(prompt, retryCount + 1);
      }
      
      throw new Error(`Error al comunicarse con la API de IA: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  /**
   * Parsea la respuesta de la IA y la convierte en objetos TestCase
   */
  private parseAIResponse(
    aiResponse: string, 
    projectId: string, 
    userStoryId: string, 
    cycleNumber: number
  ): Partial<TestCase>[] {
    try {
      // Esta es una implementación mejorada para el parser de respuestas IA
      const testCases: Partial<TestCase>[] = [];
      
      // Intentamos detectar si la respuesta tiene un formato de markdown con bloques de código
      if (aiResponse.includes('```')) {
        // Si es así, intentamos extraer los bloques de código que contengan casos de prueba
        const codeBlocks = aiResponse.match(/```(?:markdown|md|json)?([\s\S]*?)```/g);
        if (codeBlocks && codeBlocks.length > 0) {
          const cleanResponse = codeBlocks.join('\n')
            .replace(/```(?:markdown|md|json)?/g, '')
            .replace(/```/g, '');
          
          // Reprocesamos con el contenido limpio de los bloques de código
          return this.parseAIResponse(cleanResponse, projectId, userStoryId, cycleNumber);
        }
      }
      
      // Dividimos la respuesta en casos de prueba individuales usando múltiples patrones posibles
      const patrones = [
        /(?=TC-\d{3}|Caso de Prueba \d+:|Test Case \d+:|Caso \d+:)/g,
        /(?=## Caso de Prueba|## Test Case)/g,
        /(?=\n\d+\. Caso de Prueba)/g
      ];
      
      let testCaseBlocks: string[] = [];
      
      // Intentamos cada patrón hasta encontrar uno que divida la respuesta en bloques
      for (const patron of patrones) {
        const bloques = aiResponse.split(patron).filter(block => block.trim().length > 0);
        if (bloques.length > 1) {
          testCaseBlocks = bloques;
          break;
        }
      }
      
      // Si no pudimos dividir con los patrones anteriores, intentamos con una división por líneas vacías
      if (testCaseBlocks.length <= 1) {
        const posiblesBloques = aiResponse.split(/\n\s*\n/).filter(block => 
          block.match(/(?:Caso|Test Case|TC-|Prueba)/i) &&
          block.match(/(?:Pasos|Steps)/i) &&
          block.match(/(?:Resultado|Result)/i)
        );
        
        if (posiblesBloques.length > 0) {
          testCaseBlocks = posiblesBloques;
        } else {
          // Si todo falla, tratamos toda la respuesta como un solo bloque
          testCaseBlocks = [aiResponse];
        }
      }
      
      let caseCounter = 1;
      for (const block of testCaseBlocks) {
        try {
          // Extraemos la información del bloque de texto con expresiones regulares más robustas
          const nameMatch = block.match(/(?:Nombre|Título|Title|Name)(?: del caso de prueba)?:?\s*(.+?)(?:\n|$)/i);
          const typeMatch = block.match(/Tipo(?: de prueba)?:?\s*(.+?)(?:\n|$)/i);
          const priorityMatch = block.match(/Prioridad:?\s*(.+?)(?:\n|$)/i);
          const codeRefMatch = block.match(/(TC-\d{3})/i);
          const preconditionsMatch = block.match(/Precondiciones?:?\s*([\s\S]*?)(?=\n\s*\d+\.|\n\s*ID|\n\s*Nombre|\n\s*TC-|\n\s*Tipo|\n\s*$)/i);
          
          // Extracción más avanzada de pasos
          let steps: TestStep[] = [];
          
          // Método 1: Buscar sección de pasos completa
          const stepsSection = block.match(/Pasos:?\s*([\s\S]*?)(?=Resultado esperado|Resultado|Precondiciones?|$)/i);
          if (stepsSection) {
            const stepsText = stepsSection[1].trim();
            // Dividir por números de pasos (diferentes formatos: "1.", "1)", "Paso 1:", etc.)
            steps = stepsText.split(/\n\s*(?:\d+[\.\):]|Paso \d+:?)\s*/)
              .filter(step => step.trim().length > 0)
              .map(step => ({
                id: uuidv4(),
                description: step.trim().replace(/^\s*-\s*/, ''), // Eliminar viñetas iniciales si existen
                expected: ''
              }));
          }
          
          // Si no se encontraron pasos con el método anterior, intentar otro enfoque
          if (steps.length === 0) {
            const numberedSteps = block.match(/\d+[\.\)]\s*([^\n]+)/g);
            if (numberedSteps) {
              steps = numberedSteps.map(step => ({
                id: uuidv4(),
                description: step.replace(/^\d+[\.\)]\s*/, '').trim(),
                expected: ''
              }));
            }
          }
          
          // Si aún no tenemos pasos, último intento con líneas que empiezan con guión o asterisco
          if (steps.length === 0) {
            const bulletSteps = block.match(/(?:^|\n)\s*[-*]\s*([^\n]+)/g);
            if (bulletSteps) {
              steps = bulletSteps.map(step => ({
                id: uuidv4(),
                description: step.replace(/^\s*[-*]\s*/, '').trim(),
                expected: ''
              }));
            }
          }
          
          // Extracción mejorada de resultado esperado
          const resultMatch = block.match(/Resultado(?: esperado)?:?\s*([\s\S]*?)(?=Precondiciones?|TC-|Caso de Prueba|$)/i);
          let expectedResult = resultMatch ? resultMatch[1].trim() : '';
          
          // Si el resultado esperado está vacío, intentar buscarlo con otro patrón
          if (!expectedResult) {
            const alternativeResultMatch = block.match(/(?:Se espera|Esperado|Expected|Resultado|Result):?\s*([\s\S]*?)(?=Precondiciones?|TC-|Caso de Prueba|$)/i);
            expectedResult = alternativeResultMatch ? alternativeResultMatch[1].trim() : '';
          }
          
          // Buscar observaciones o notas
          const observationsMatch = block.match(/(?:Observaciones|Notas|Notes|Observations):?\s*([\s\S]*?)(?=TC-|Caso de Prueba|$)/i);
          const observations = observationsMatch ? observationsMatch[1].trim() : '';
          
          // Generar un código de referencia si no se encontró
          const codeRef = codeRefMatch ?
            codeRefMatch[1] :
            userStoryId ?
              `${userStoryId}-TC${String(caseCounter).padStart(2, '0')}` :
              `TC-${String(caseCounter).padStart(3, '0')}`;

          // Extraer posibles precondiciones
          const preconditions = preconditionsMatch ? preconditionsMatch[1].trim() : '';

          // Generar nombre específico si la IA no lo hizo correctamente
          let testCaseName = nameMatch ? nameMatch[1].trim() : '';

          // Si el nombre es genérico o vacío, generar uno específico basado en el requerimiento
          if (!testCaseName || testCaseName.length < 10 ||
              testCaseName.toLowerCase().includes('caso de prueba') ||
              testCaseName.toLowerCase().includes('test case') ||
              !testCaseName.match(/[a-zA-Z]{3,}/)) {

            // Generar nombre específico basado en la HU y el contador
            const baseName = this.generateSpecificTestName(userStoryId, caseCounter);
            testCaseName = baseName;
          }

          // Crear el objeto de caso de prueba con toda la información extraída
          const testCase: Partial<TestCase> = {
            id: uuidv4(),
            projectId,
            userStoryId,
            name: testCaseName,
            codeRef,
            testType: this.mapTestType(typeMatch ? typeMatch[1].trim() : 'Funcional'),
            steps,
            // Añadimos precondiciones y observaciones al resultado esperado
            expectedResult: [
              expectedResult,
              preconditions ? `Precondiciones: ${preconditions}` : '',
              observations ? `Observaciones: ${observations}` : ''
            ].filter(Boolean).join('\n\n'),
            cycle: cycleNumber,
            status: 'No ejecutado',
            defects: [],
            evidences: [],
            priority: this.mapPriority(priorityMatch ? priorityMatch[1].trim() : 'Media'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          testCases.push(testCase);
          caseCounter++;
        } catch (blockError) {
          console.error('Error parsing individual test case block:', blockError);
          // Registrar el bloque problemático para depuración
          console.log('Problematic block:', block);
          // Continuamos con el siguiente bloque si hay un error en el actual
          continue;
        }
      }

      return testCases;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return [];
    }
  }
  
  /**
   * Mapea el tipo de prueba a un valor válido
   */
  private mapTestType(type: string): TestCase['testType'] {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('func')) return 'Funcional';
    if (typeLower.includes('no func')) return 'No Funcional';
    if (typeLower.includes('regre')) return 'Regresión';
    if (typeLower.includes('explor')) return 'Exploratoria';
    if (typeLower.includes('integ')) return 'Integración';
    if (typeLower.includes('rend')) return 'Rendimiento';
    if (typeLower.includes('segur')) return 'Seguridad';
    return 'Funcional';
  }
  
  /**
   * Mapea la prioridad a un valor válido
   */
  private mapPriority(priority: string): TestCase['priority'] {
    const priorityLower = priority.toLowerCase();
    // Considerar diferentes formas de expresar prioridades
    if (priorityLower.includes('alta') || 
        priorityLower.includes('high') || 
        priorityLower.includes('critical') || 
        priorityLower.includes('crítica')) {
      return 'Alta';
    }
    
    if (priorityLower.includes('baja') || 
        priorityLower.includes('low') || 
        priorityLower.includes('minor')) {
      return 'Baja';
    }
    
    // Por defecto, asignar prioridad media
    return 'Media';
  }
  
  /**
   * Valida la configuración de la API antes de hacer llamadas
   */
  public async validateApiConfig(): Promise<{ valid: boolean; message?: string }> {
    try {
      if (!this.apiKey) {
        return {
          valid: false,
          message: 'No se ha configurado la clave de API de Groq'
        };
      }

      // Realizar una pequeña llamada de prueba
      const testResponse = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },        body: JSON.stringify({
          model: this.apiModel,
          messages: [
            {
              role: "system",
              content: "Eres un asistente de pruebas."
            },
            {
              role: "user",
              content: "Responde con OK"
            }
          ],
          temperature: 0.7,
          max_tokens: 10
        })
      });

      if (!testResponse.ok) {
        const errorData = await testResponse.text();
        return {
          valid: false,
          message: `Error de configuración: ${testResponse.status} ${testResponse.statusText} - ${errorData}`
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: `Error validando la configuración: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Método estático para validar la configuración de la API
   */
  static async validateApiConfiguration(): Promise<{ valid: boolean; message?: string }> {
    const service = new AITestCaseGeneratorService();
    return service.validateApiConfig();
  }

  // ============ NUEVOS MÉTODOS PARA LA INTERFAZ PROPUESTA ============

  /**
   * Generación automática desde historias de usuario
   * Método principal de la interfaz AITestCaseGenerator
   */
  async generateFromUserStory(userStory: string, options?: {
    projectId?: string;
    testPlanId?: string;
    cycleNumber?: number;
    contextualInfo?: string;
  }): Promise<TestCase[]> {
    try {
      console.log('🎯 Generando casos desde historia de usuario con instrucciones detalladas');
      console.log('📝 Historia de usuario:', userStory.substring(0, 100) + '...');
      
      // Convertir la historia de usuario en formato ExcelRequirementData
      const requirement: ExcelRequirementData = {
        userStoryId: '', // Dejar vacío inicialmente para que enrichRequirement lo extraiga
        requirementName: userStory,
        description: userStory,
        acceptanceCriteria: this.extractAcceptanceCriteria(userStory),
        priority: 'Media',
        complexity: 'Media'
      };

      // Enriquecer el requisito para extraer el ID real de la historia de usuario
      this.enrichRequirement(requirement);

      console.log('🔧 Requisito convertido:', {
        userStoryId: requirement.userStoryId,
        requirementName: requirement.requirementName?.substring(0, 50) + '...',
        acceptanceCriteriaCount: requirement.acceptanceCriteria?.length || 0
      });

      // Usar el método existente generateTestCases
      const testCases = await this.generateTestCases(
        options?.projectId || uuidv4(),
        [requirement],
        options?.cycleNumber || 1,
        options?.testPlanId,
        options?.contextualInfo
      );

      console.log('✅ Casos generados desde historia de usuario:', testCases.length);
      return testCases as TestCase[];
    } catch (error) {
      console.error('Error generando casos desde historia de usuario:', error);
      throw new Error('No se pudieron generar los casos de prueba desde la historia de usuario');
    }
  }

  /**
   * Generación desde requisitos funcionales
   * Método principal de la interfaz AITestCaseGenerator
   */
  async generateFromRequirements(requirements: string[], options?: {
    projectId?: string;
    testPlanId?: string;
    cycleNumber?: number;
    contextualInfo?: string;
  }): Promise<TestCase[]> {
    try {
      console.log('🎯 Generando casos desde requisitos con instrucciones detalladas');
      console.log('📝 Número de requisitos:', requirements.length);
      console.log('📋 Primer requisito:', requirements[0]?.substring(0, 100) + '...' || 'Ninguno');
      
      // Convertir los requisitos en formato ExcelRequirementData
      const excelRequirements: ExcelRequirementData[] = requirements.map((req, index) => {
        const requirement: ExcelRequirementData = {
          userStoryId: '', // Dejar vacío inicialmente para que enrichRequirement lo extraiga
          requirementName: req,
          description: req,
          acceptanceCriteria: this.extractAcceptanceCriteria(req),
          priority: 'Media',
          complexity: 'Media'
        };
        
        // Enriquecer el requisito para extraer el ID real
        this.enrichRequirement(requirement);
        
        return requirement;
      });

      console.log('🔧 Requisitos convertidos:', excelRequirements.length);
      console.log('🔧 Primer requisito convertido:', {
        userStoryId: excelRequirements[0]?.userStoryId,
        requirementName: excelRequirements[0]?.requirementName?.substring(0, 50) + '...',
        acceptanceCriteriaCount: excelRequirements[0]?.acceptanceCriteria?.length || 0
      });

      // Usar el método existente generateTestCases
      const testCases = await this.generateTestCases(
        options?.projectId || uuidv4(),
        excelRequirements,
        options?.cycleNumber || 1,
        options?.testPlanId,
        options?.contextualInfo
      );

      console.log('✅ Casos generados desde requisitos:', testCases.length);
      return testCases as TestCase[];
    } catch (error) {
      console.error('Error generando casos desde requisitos:', error);
      throw new Error('No se pudieron generar los casos de prueba desde los requisitos');
    }
  }

  /**
   * Sugerencias de escenarios de prueba
   * Método principal de la interfaz AITestCaseGenerator
   */
  async suggestTestScenarios(project: Project, options?: {
    contextualInfo?: string;
  }): Promise<string[]> {
    try {
      const prompt = `Analiza el siguiente proyecto y sugiere escenarios de prueba relevantes:

Proyecto: ${project.proyecto || project.nombre || 'Sin nombre'}
${project.descripcion ? `Descripción: ${project.descripcion}` : ''}
${options?.contextualInfo ? `Información adicional: ${options.contextualInfo}` : ''}

Por favor, sugiere escenarios de prueba específicos y relevantes para este proyecto. Incluye:
- Escenarios funcionales principales
- Casos edge y de error
- Escenarios de integración
- Pruebas de rendimiento si aplica
- Pruebas de seguridad si aplica

Responde en formato de lista numerada con descripciones claras.`;

      const response = await this.callAIAPI(prompt);
      return this.parseScenariosFromResponse(response);
    } catch (error) {
      console.error('Error generando sugerencias de escenarios:', error);
      throw new Error('No se pudieron generar las sugerencias de escenarios');
    }
  }

  /**
   * Análisis de cobertura de pruebas
   * Método principal de la interfaz AITestCaseGenerator
   */
  async analyzeTestCoverage(projectId: string, existingTestCases?: TestCase[]): Promise<CoverageReport> {
    try {
      const testCasesText = existingTestCases ?
        existingTestCases.map(tc => `- ${tc.name}: ${tc.expectedResult}`).join('\n') :
        'No hay casos de prueba existentes';

      const prompt = `Analiza la cobertura de pruebas del proyecto con ID: ${projectId}

Casos de prueba existentes:
${testCasesText}

Por favor, proporciona un análisis detallado que incluya:
1. Porcentaje estimado de cobertura actual
2. Escenarios faltantes o insuficientemente cubiertos
3. Áreas de riesgo que necesitan más pruebas
4. Recomendaciones específicas para mejorar la cobertura

Responde en formato JSON con la siguiente estructura:
{
  "coveragePercentage": número,
  "missingScenarios": ["escenario1", "escenario2"],
  "riskAreas": ["riesgo1", "riesgo2"],
  "recommendations": ["recomendación1", "recomendación2"]
}`;

      const response = await this.callAIAPI(prompt);
      return this.parseCoverageReport(response);
    } catch (error) {
      console.error('Error analizando cobertura de pruebas:', error);
      throw new Error('No se pudo analizar la cobertura de pruebas');
    }
  }

  // ============ MÉTODOS AUXILIARES ============

  /**
   * Extrae criterios de aceptación de una historia de usuario o requisito
   */
  private extractAcceptanceCriteria(text: string): string[] {
    // Buscar patrones comunes de criterios de aceptación
    const patterns = [
      /dado que|given|when|entonces|then|and|pero|but|y/i,
      /debe|should|shall|must|will/i,
      /poder|can|able to/i
    ];

    const criteria: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (patterns.some(pattern => pattern.test(trimmed))) {
        criteria.push(trimmed);
      }
    });

    return criteria.length > 0 ? criteria : [text];
  }

  /**
   * Parsea escenarios desde la respuesta de la IA
   */
  private parseScenariosFromResponse(response: string): string[] {
    const scenarios: string[] = [];

    // Buscar listas numeradas o con viñetas
    const lines = response.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      const trimmed = line.trim();
      // Detectar líneas que parecen escenarios
      if (
        /^\d+[\.)]/.test(trimmed) || // 1. 1) etc
        /^[-*+]/.test(trimmed) || // - * + etc
        trimmed.length > 20 // Líneas largas que parecen descripciones
      ) {
        // Limpiar marcadores de lista
        const cleanScenario = trimmed
          .replace(/^\d+[\.)]\s*/, '')
          .replace(/^[-*+]\s*/, '')
          .trim();

        if (cleanScenario.length > 10) {
          scenarios.push(cleanScenario);
        }
      }
    });

    return scenarios.length > 0 ? scenarios : [response];
  }

  /**
   * Parsea el reporte de cobertura desde la respuesta JSON de la IA
   */
  private parseCoverageReport(response: string): CoverageReport {
    try {
      // Intentar parsear como JSON
      const parsed = JSON.parse(response);
      return {
        coveragePercentage: parsed.coveragePercentage || 0,
        missingScenarios: parsed.missingScenarios || [],
        riskAreas: parsed.riskAreas || [],
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      // Si no es JSON válido, extraer información del texto
      const coverageMatch = response.match(/(\d+(?:\.\d+)?)%/);
      const coveragePercentage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

      const missingScenarios = this.extractListItems(response, 'faltante|missing|sin cubrir');
      const riskAreas = this.extractListItems(response, 'riesgo|risk|crítico|critical');
      const recommendations = this.extractListItems(response, 'recomend|recommend|suger|suggest');

      return {
        coveragePercentage,
        missingScenarios,
        riskAreas,
        recommendations
      };
    }
  }

  /**
   * Genera un nombre específico para el caso de prueba basado en la HU
   */
  private generateSpecificTestName(userStoryId: string, caseCounter: number): string {
    // Mapa de nombres específicos por HU
    const huSpecificNames: Record<string, string[]> = {
      'HU1': [
        'Validar creación de campos Monto, Plazo y Producto en informe Jasper',
        'Verificar cálculo automático de intereses en formulario de préstamo',
        'Comprobar validación de datos obligatorios en solicitud de crédito',
        'Validar integración con sistema de reportes Jasper para generación de informes',
        'Verificar persistencia de datos del préstamo en base de datos',
        'Comprobar formato y presentación del informe Jasper generado',
        'Validar reglas de negocio para aprobación automática de préstamos',
        'Verificar notificaciones por email al crear préstamo aprobado'
      ],
      'HU2': [
        'Validar visualización de lista de préstamos con filtros aplicados',
        'Verificar ordenamiento de préstamos por fecha de creación',
        'Comprobar paginación en lista de préstamos del sistema',
        'Validar búsqueda de préstamos por número de identificación',
        'Verificar filtros por estado del préstamo (aprobado, rechazado, pendiente)',
        'Comprobar exportación de lista de préstamos a Excel',
        'Validar permisos de visualización según rol del usuario',
        'Verificar actualización automática de la lista al crear nuevo préstamo'
      ]
    };

    // Obtener nombres específicos para la HU
    const specificNames = huSpecificNames[userStoryId] || [];

    // Si tenemos nombres específicos para esta HU, usar uno basado en el contador
    if (specificNames.length > 0) {
      const nameIndex = (caseCounter - 1) % specificNames.length;
      return specificNames[nameIndex];
    }

    // Fallback: generar nombre genérico pero más específico que el anterior
    const genericNames = [
      'Validar funcionalidad principal del requerimiento',
      'Verificar comportamiento del sistema bajo condiciones normales',
      'Comprobar integración con componentes externos',
      'Validar reglas de negocio implementadas',
      'Verificar manejo de errores y excepciones',
      'Comprobar rendimiento de la funcionalidad',
      'Validar seguridad y permisos de acceso',
      'Verificar logging y auditoría de acciones'
    ];

    const genericIndex = (caseCounter - 1) % genericNames.length;
    // Remover la duplicación del userStoryId en el nombre
    return genericNames[genericIndex];
  }

  /**
   * Extrae elementos de lista basados en palabras clave
   */
  private extractListItems(text: string, keywords: string): string[] {
    const keywordRegex = new RegExp(keywords, 'i');
    const items: string[] = [];

    const lines = text.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (keywordRegex.test(line)) {
        const cleanLine = line
          .replace(/^\d+[\.)]\s*/, '')
          .replace(/^[-*+]\s*/, '')
          .replace(new RegExp(`.*${keywords}.*?[:\-]?\s*`, 'i'), '')
          .trim();

        if (cleanLine.length > 5) {
          items.push(cleanLine);
        }
      }
    });

    return items;
  }
}

export default AITestCaseGeneratorService;
