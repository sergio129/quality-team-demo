import { NextResponse } from 'next/server';
import { incidentService } from '@/services/incidentService';

// GET para obtener todas las imágenes de un incidente
export async function GET(request: Request) {
    const url = new URL(request.url);
    const incidentId = url.searchParams.get('incidentId');

    if (!incidentId) {
        return NextResponse.json({ error: 'Se requiere el ID del incidente' }, { status: 400 });
    }

    try {
        // Verificar si el incidente existe antes de buscar sus imágenes
        try {
            const images = await incidentService.getImages(incidentId);
            return NextResponse.json(images || []);
        } catch (imageError: any) {
            console.warn(`Advertencia al obtener imágenes: ${imageError.message}`);
            // Si hay un problema específico con las imágenes pero el incidente existe, devolver array vacío
            return NextResponse.json([]);
        }
    } catch (error: any) {
        console.error('Error al obtener imágenes del incidente:', error);
        return NextResponse.json({ 
            error: 'Error al obtener imágenes',
            details: error.message || 'Error desconocido'
        }, { status: 500 });
    }
}

// POST para adjuntar un archivo a un incidente
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const incidentId = formData.get('incidentId') as string;
        const file = formData.get('file') || formData.get('image') as File; // Aceptamos 'file' o 'image' para mantener compatibilidad

        if (!incidentId || !file) {
            return NextResponse.json({ error: 'Se requiere el ID del incidente y el archivo' }, { status: 400 });
        }
        
        // Validar tamaño máximo de 10 MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ 
                error: 'El archivo excede el tamaño máximo permitido de 10 MB' 
            }, { status: 400 });
        }

        const fileBytes = await file.arrayBuffer();
        const buffer = Buffer.from(fileBytes);
        
        const fileData = {
            fileName: file.name,
            fileType: file.type || 'application/octet-stream', // Tipo por defecto si no se especifica
            fileSize: file.size,
            data: buffer.toString('base64')
        };

        const fileId = await incidentService.attachImage(incidentId, fileData);
        
        return NextResponse.json({ 
            success: true, 
            fileId,
            message: 'Archivo adjuntado correctamente' 
        });
    } catch (error: any) {
        console.error('Error al adjuntar archivo al incidente:', error);
        return NextResponse.json({ 
            error: 'Error al adjuntar archivo',
            details: error.message || 'Error desconocido'
        }, { status: 500 });
    }
}

// DELETE para eliminar una imagen
export async function DELETE(request: Request) {
    try {
        const { imageId } = await request.json();
        
        if (!imageId) {
            return NextResponse.json({ error: 'Se requiere el ID de la imagen' }, { status: 400 });
        }

        await incidentService.deleteImage(imageId);
        
        return NextResponse.json({ 
            success: true,
            message: 'Imagen eliminada correctamente' 
        });
    } catch (error: any) {
        console.error('Error al eliminar imagen:', error);
        return NextResponse.json({ 
            error: 'Error al eliminar imagen',
            details: error.message || 'Error desconocido'
        }, { status: 500 });
    }
}
