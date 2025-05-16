import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';

export async function POST(req: NextRequest) {
    try {
        const { projectId, newStatus } = await req.json();
        
        if (!projectId || !newStatus) {
            return NextResponse.json(
                { message: 'Se requiere un ID de proyecto y un nuevo estado' }, 
                { status: 400 }
            );
        }
        
        // Validar que el estado sea uno de los estados permitidos
        const validStatuses = ['Por Iniciar', 'En Progreso', 'Certificado'];
        if (!validStatuses.includes(newStatus)) {
            return NextResponse.json(
                { message: 'Estado no válido. Debe ser uno de: Por Iniciar, En Progreso, Certificado' }, 
                { status: 400 }
            );
        }
        
        const success = await projectService.updateProjectStatus(projectId, newStatus);
        
        if (success) {
            return NextResponse.json({ message: 'Estado del proyecto actualizado con éxito' });
        }
        
        return NextResponse.json(
            { message: 'No se pudo actualizar el estado del proyecto' }, 
            { status: 404 }
        );
    } catch (error) {
        console.error('Error actualizando el estado del proyecto:', error);
        return NextResponse.json(
            { message: 'Error al procesar la solicitud' }, 
            { status: 500 }
        );
    }
}
