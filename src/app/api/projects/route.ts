import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';
import { testCaseService } from '@/services/testCaseService';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        const url = new URL(req.url);
        const analystId = url.searchParams.get('analystId') || session.user.analystId;
        const analystName = url.searchParams.get('analystName');
        const monthFilter = url.searchParams.get('month');
        const yearFilter = url.searchParams.get('year');
        const role = url.searchParams.get('role') || session.user.role;
        
        console.log(`[API:Projects] Request from user: ${session.user.name}`);
        console.log(`[API:Projects] User role: ${session.user.role}`);
        console.log(`[API:Projects] Analyst ID: ${analystId || 'No asignado'}`);
        
        // Usar nuestro servicio con filtrado basado en rol
        const projects = await projectService.getAllProjects({
            analystId: analystId || undefined,
            role: role
        });
        
        console.log(`[API:Projects] Found ${projects.length} projects`);
        
        if (projects.length === 0 && analystId) {
            // Si no hay proyectos y tenemos un analystId, verificar si el analista existe
            console.log(`[API:Projects] No projects found for analyst ${analystId}, checking analyst...`);
            
            try {
                const analyst = await prisma.qAAnalyst.findUnique({
                    where: { id: analystId },
                    include: {
                        projects: true
                    }
                });
                
                if (analyst) {
                    console.log(`[API:Projects] Analyst found: ${analyst.name}`);
                    console.log(`[API:Projects] Analyst has ${analyst.projects.length} project relations`);
                } else {
                    console.log(`[API:Projects] Analyst not found with ID: ${analystId}`);
                }
            } catch (error) {
                console.error(`[API:Projects] Error checking analyst:`, error);
            }
        }
        
        // Filtrado inicial de proyectos
        let filteredProjects = projects;
    
    // Si se proporciona un nombre de analista (para compatibilidad), filtrar los proyectos
    if (analystName) {
        filteredProjects = filteredProjects.filter(project => {
            // Buscar por nombre en el campo analistaProducto
            return project.analistaProducto === analystName;
        });
    }    // Si se proporciona mes y año, filtrar por fecha
    if (monthFilter && yearFilter) {
        const month = parseInt(monthFilter);
        const year = parseInt(yearFilter);
        
        // Imprimir los parámetros para debugging
        console.log(`Filtering by month: ${month}, year: ${year}`);
        
        // Crear fecha de inicio y fin del mes
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0); // El día 0 del siguiente mes es el último del mes actual
        
        console.log(`Start of month: ${startOfMonth.toISOString()}, End of month: ${endOfMonth.toISOString()}`);
        
        filteredProjects = filteredProjects.filter(project => {
            // Verificar si hay fecha de entrega
            if (project.fechaEntrega) {
                const entregaDate = new Date(project.fechaEntrega);
                
                // Un proyecto pertenece al mes si:
                // 1. Su fecha de entrega está dentro del mes, o
                // 2. Su fecha de certificación está dentro del mes, o
                // 3. Si se extiende por todo el mes (inicia antes y termina después)
                
                const fechaCert = project.fechaCertificacion ? new Date(project.fechaCertificacion) : null;
                
                const isInMonth = 
                    // La fecha de entrega está en el mes
                    (entregaDate >= startOfMonth && entregaDate <= endOfMonth) ||
                    // La fecha de certificación está en el mes
                    (fechaCert && fechaCert >= startOfMonth && fechaCert <= endOfMonth) ||
                    // El proyecto abarca todo el mes (comienza antes y termina después)
                    (entregaDate <= startOfMonth && fechaCert && fechaCert >= endOfMonth);
                
                console.log(`Project ${project.idJira}: date=${entregaDate.toISOString()}, isInMonth=${isInMonth}`);
                return isInMonth;
            }
            return false;
        });
    }
    
    return NextResponse.json(filteredProjects);
    
    } catch (error) {
        console.error('[API] Error al obtener proyectos:', error);
        return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        // Solo los administradores (QA Leader) pueden crear proyectos
        if (session.user.role !== 'QA Leader') {
            return NextResponse.json({ error: "No tienes permiso para crear proyectos" }, { status: 403 });
        }
        
        const project = await req.json();
        console.log('[API] Datos recibidos para crear proyecto:', JSON.stringify(project, null, 2));
        
        // Validar campos obligatorios
        if (!project.idJira || !project.proyecto || !project.equipo || !project.celula) {
            return NextResponse.json({
                message: 'Error: Faltan campos obligatorios (idJira, proyecto, equipo, celula)',
                data: project
            }, { status: 400 });
        }
        
        // Asegurar que se tienen los valores numéricos correctos
        if (project.horas === undefined) project.horas = 0;
        if (project.dias === undefined) project.dias = 0;
        if (project.diasRetraso === undefined) project.diasRetraso = 0;
        
        // Asegurar que las fechas sean objetos Date
        if (project.fechaEntrega) {
            project.fechaEntrega = new Date(project.fechaEntrega);
        } else {
            return NextResponse.json({
                message: 'Error: La fecha de entrega es obligatoria',
                data: project
            }, { status: 400 });
        }
        
        if (project.fechaCertificacion) {
            project.fechaCertificacion = new Date(project.fechaCertificacion);
        }
        
        const success = await projectService.saveProject(project);
        if (success) {
            // Crear automáticamente un plan de pruebas para el nuevo proyecto
            try {            // Crear un plan de pruebas con valores predeterminados
            const now = new Date();
            
            // Corregir problema con fechas (garantizar que se use la fecha correcta)
            // Formatear la fecha manualmente para evitar problemas con zonas horarias
            const currentDate = now.getDate().toString().padStart(2, '0');
            const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
            const currentYear = now.getFullYear();
            const formattedDate = `${currentYear}-${currentMonth}-${currentDate}`;
              // Calcular horas estimadas según el proyecto
            let estimatedHours = 0;
            if (project.horas) {
                estimatedHours = parseFloat(project.horas) || 0;
            }
            
            // Calcular días estimados (1 día = 9 horas)
            const estimatedDays = estimatedHours > 0 ? Math.round((estimatedHours / 9) * 10) / 10 : 0;
              // Formatear fecha de entrega adecuadamente, si existe
            let formattedEndDate = '';
            if (project.fechaEntrega) {
                if (typeof project.fechaEntrega === 'string') {
                    // Si es un string, eliminar cualquier parte de tiempo si existe
                    formattedEndDate = project.fechaEntrega.split('T')[0];
                } else {
                    // Si es un objeto Date, formatear correctamente
                    const entregaDate = new Date(project.fechaEntrega);
                    formattedEndDate = `${entregaDate.getFullYear()}-${
                        (entregaDate.getMonth() + 1).toString().padStart(2, '0')}-${
                        entregaDate.getDate().toString().padStart(2, '0')}`;
                }
            }
            
            const testPlan = {
                id: uuidv4(),
                projectId: project.idJira,
                projectName: project.proyecto || 'Proyecto sin nombre',
                codeReference: project.idJira,
                startDate: formattedDate,
                endDate: formattedEndDate,
                estimatedHours: estimatedHours,
                estimatedDays: estimatedDays,
                totalCases: 0,
                cycles: [
                    {
                        id: uuidv4(),
                        number: 1,
                        designed: 0,
                        successful: 0,
                        notExecuted: 0,
                        defects: 0
                    }
                ],
                testQuality: 100, // Calidad perfecta inicial
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            };
            
            // Guardar el plan de pruebas
            await testCaseService.saveTestPlan(testPlan);
            
            return NextResponse.json({ 
                message: 'Project created successfully with test plan',
                project,
                testPlan
            });
        } catch (error) {
            console.error('Error creating test plan for project:', error);
            // Aun si falla la creación del plan, devolvemos éxito ya que el proyecto se creó
            return NextResponse.json({ 
                message: 'Project created successfully but failed to create test plan',
                project
            });
        }    }
    } catch (error: any) {
        console.error('[API] Error al crear proyecto:', error);
        return NextResponse.json({ 
            message: 'Error creating project',
            details: error?.message || 'Error desconocido',
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        }, { status: 500 });
    }
}

/**
 * Actualiza un proyecto existente
 * Versión mejorada con mejor manejo de errores y tipos
 */
export async function PUT(req: NextRequest) {
    try {
        const data = await req.json();
        
        // Depuración: mostrar los datos recibidos
        console.log('[API] Datos recibidos para actualización:', JSON.stringify(data, null, 2));
        
        // Verificamos si la solicitud viene en el formato nuevo (con idJira separado) 
        // o en el formato antiguo (idJira dentro del proyecto)
        const idJira = data.id || data.idJira || (data.project && data.project.idJira);
        
        console.log('[API] ID Jira extraído:', idJira);
        
        if (!idJira) {
            return NextResponse.json(
                { message: 'Error: Se requiere un ID de Jira válido para actualizar un proyecto' }, 
                { status: 400 }
            );
        }
        
        // Aseguramos que tenemos un objeto plano con todas las propiedades necesarias
        // Si tenemos un objeto project anidado, lo aplanamos correctamente
        let projectToUpdate: any = {};
        if (data.project) {
            console.log('[API] Usando datos del objeto project anidado');
            projectToUpdate = { ...data.project };
            // Aseguramos que idJira está presente en el objeto a actualizar
            if (!projectToUpdate.idJira && idJira) {
                projectToUpdate.idJira = idJira;
            }
        } else {
            console.log('[API] Usando datos directamente del objeto principal');
            projectToUpdate = { ...data };
        }
        
        console.log('[API] Objeto preparado para actualización:', JSON.stringify(projectToUpdate, null, 2));
        
        console.log(`[API] Actualizando proyecto con idJira: ${idJira}`);
        
        try {
            // Preparar el proyecto para actualizar con conversiones seguras
            const safeProject: any = { ...projectToUpdate };
            
            // Convertir campos de fecha con manejo de errores
            try {
                if (safeProject.fechaEntrega) {
                    safeProject.fechaEntrega = new Date(safeProject.fechaEntrega);
                }
                if (safeProject.fechaInicio) {
                    safeProject.fechaInicio = new Date(safeProject.fechaInicio);
                }
                if (safeProject.fechaFin) {
                    safeProject.fechaFin = new Date(safeProject.fechaFin);
                }
                if (safeProject.fechaRealEntrega) {
                    safeProject.fechaRealEntrega = new Date(safeProject.fechaRealEntrega);
                }
                if (safeProject.fechaCertificacion) {
                    safeProject.fechaCertificacion = new Date(safeProject.fechaCertificacion);
                }
            } catch (dateError) {
                console.error('[API] Error al convertir fechas:', dateError);
                // Continuar con la actualización sin las fechas problemáticas
            }
            
            // Convertir campos numéricos
            if (safeProject.horas !== undefined) {
                safeProject.horas = Number(safeProject.horas) || 0;
            }
            if (safeProject.dias !== undefined) {
                safeProject.dias = Number(safeProject.dias) || 0;
            }
            if (safeProject.diasRetraso !== undefined) {
                safeProject.diasRetraso = Number(safeProject.diasRetraso) || 0;
            }
            if (safeProject.horasEstimadas !== undefined && safeProject.horasEstimadas !== null) {
                safeProject.horasEstimadas = Number(safeProject.horasEstimadas) || 0;
            }
            
            // Saneamiento de campos especiales
            if (!safeProject.analistas || !Array.isArray(safeProject.analistas)) {
                safeProject.analistas = [];
            }
              // Mantener consistencia entre estado y estadoCalculado
            if (safeProject.estado) {
                safeProject.estadoCalculado = safeProject.estado;
            } else if (safeProject.estadoCalculado) {
                safeProject.estado = safeProject.estadoCalculado;
            }
            
            // Detectar certificación: Si se está estableciendo el estado a "Certificado" y no hay fecha de certificación,
            // establecer la fecha de certificación a la fecha actual
            if ((safeProject.estado === 'Certificado' || safeProject.estadoCalculado === 'Certificado') && 
                !safeProject.fechaCertificacion) {
                console.log('[API] Estableciendo fecha de certificación automáticamente');
                safeProject.fechaCertificacion = new Date();
            }
            
            // Intentar actualizar el proyecto
            const success = await projectService.updateProject(idJira, safeProject);
            
            if (success) {
                // Obtener el proyecto actualizado para devolverlo en la respuesta
                const updatedProjects = await projectService.getAllProjects();
                const updatedProject = updatedProjects.find(p => p.idJira === idJira);
                return NextResponse.json(updatedProject || { message: 'Project updated successfully' });
            }
              throw new Error('No se pudo actualizar el proyecto');
        } catch (serviceError: any) {
            console.error('[API] Error en el servicio:', serviceError);
            return NextResponse.json({ 
                message: 'Error interno al actualizar el proyecto',
                error: 'No se pudo actualizar el proyecto',
                details: serviceError?.message || 'Error desconocido'
            }, { status: 500 });
        }    } catch (error: any) {
        console.error('[API] Error general:', error);
        return NextResponse.json({ 
            message: 'Error al procesar la solicitud',
            error: error?.message || 'Error desconocido',
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { idJira } = await req.json();
    
    if (!idJira) {
        return NextResponse.json(
            { message: 'Error: Se requiere un ID de Jira válido para eliminar un proyecto' },
            { status: 400 }
        );
    }
    
    const success = await projectService.deleteProject(idJira);
    if (success) {
        return NextResponse.json({ message: 'Project deleted successfully' });
    }
    return NextResponse.json({ message: 'Error deleting project' }, { status: 500 });
}
