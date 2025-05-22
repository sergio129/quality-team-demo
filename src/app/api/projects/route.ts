import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';
import { testCaseService } from '@/services/testCaseService';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const analystId = url.searchParams.get('analystId');
    const analystName = url.searchParams.get('analystName');
    const monthFilter = url.searchParams.get('month');
    const yearFilter = url.searchParams.get('year');
    
    const projects = await projectService.getAllProjects();
    
    // Filtrado inicial de proyectos
    let filteredProjects = projects;
    
    // Si se proporciona un ID de analista o nombre, filtrar los proyectos
    if (analystId || analystName) {
        filteredProjects = filteredProjects.filter(project => {
            // Buscar por ID en el array de analistas
            const matchesById = analystId && project.analistas && 
                Array.isArray(project.analistas) && 
                project.analistas.includes(analystId);
                
            // Buscar por nombre en el campo analistaProducto
            const matchesByName = analystName && project.analistaProducto === analystName;
            
            return matchesById || matchesByName;
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
}

export async function POST(req: NextRequest) {
    const project = await req.json();
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
        }
    }
    return NextResponse.json({ message: 'Error creating project' }, { status: 500 });
}

export async function PUT(req: NextRequest) {
    const data = await req.json();
    
    // Verificamos si la solicitud viene en el formato nuevo (con idJira separado) 
    // o en el formato antiguo (idJira dentro del proyecto)
    const idJira = data.idJira || (data.project && data.project.idJira);
    
    if (!idJira) {
        return NextResponse.json(
            { message: 'Error: Se requiere un ID de Jira válido para actualizar un proyecto' }, 
            { status: 400 }
        );
    }
    
    // Si tenemos un objeto project anidado, usamos esa estructura
    const projectToUpdate = data.project ? { ...data.project } : data;
    
    console.log(`Actualizando proyecto con idJira: ${idJira}`, projectToUpdate);
    
    // Obtenemos el proyecto existente antes de actualizarlo
    const existingProjects = await projectService.getAllProjects();
    const existingProject = existingProjects.find(p => p.idJira === idJira);
    
    if (!existingProject) {
        return NextResponse.json(
            { message: `Error: No se encontró un proyecto con idJira: ${idJira}` }, 
            { status: 404 }
        );
    }
    
    const success = await projectService.updateProject(idJira, projectToUpdate);
    if (success) {
        // Obtener el proyecto actualizado para devolverlo en la respuesta
        const updatedProjects = await projectService.getAllProjects();
        const updatedProject = updatedProjects.find(p => p.idJira === idJira);
        return NextResponse.json(updatedProject || { message: 'Project updated successfully' });
    }
    return NextResponse.json({ message: 'Error updating project' }, { status: 500 });
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
