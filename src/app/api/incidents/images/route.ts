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
        const images = await incidentService.getImages(incidentId);
        return NextResponse.json(images);
    } catch (error: any) {
        console.error('Error al obtener imágenes del incidente:', error);
        return NextResponse.json({ 
            error: 'Error al obtener imágenes',
            details: error.message || 'Error desconocido'
        }, { status: 500 });
    }
}

// POST para adjuntar una imagen a un incidente
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const incidentId = formData.get('incidentId') as string;
        const file = formData.get('image') as File;

        if (!incidentId || !file) {
            return NextResponse.json({ error: 'Se requiere el ID del incidente y la imagen' }, { status: 400 });
        }

        const fileBytes = await file.arrayBuffer();
        const buffer = Buffer.from(fileBytes);
        
        const imageData = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            data: buffer.toString('base64')
        };

        const imageId = await incidentService.attachImage(incidentId, imageData);
        
        return NextResponse.json({ 
            success: true, 
            imageId,
            message: 'Imagen adjuntada correctamente' 
        });
    } catch (error: any) {
        console.error('Error al adjuntar imagen al incidente:', error);
        return NextResponse.json({ 
            error: 'Error al adjuntar imagen',
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
