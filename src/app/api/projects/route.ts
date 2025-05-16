import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';

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
        return NextResponse.json({ message: 'Project created successfully' });
    }
    return NextResponse.json({ message: 'Error creating project' }, { status: 500 });
}

export async function PUT(req: NextRequest) {
    const updatedProject = await req.json();
    
    if (!updatedProject || !updatedProject.idJira) {
        return NextResponse.json(
            { message: 'Error: Se requiere un ID de Jira válido para actualizar un proyecto' }, 
            { status: 400 }
        );
    }
    
    const success = await projectService.updateProject(updatedProject.idJira, updatedProject);
    if (success) {
        return NextResponse.json({ message: 'Project updated successfully' });
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
