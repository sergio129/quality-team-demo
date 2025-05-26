import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const incidentId = formData.get('incidentId') as string;
        const fileEntry = formData.get('file') || formData.get('image');

        if (!incidentId || !fileEntry || !(fileEntry instanceof File)) {
            return NextResponse.json({ 
                error: 'Se requiere el ID del incidente y un archivo válido' 
            }, { status: 400 });
        }

        const file = fileEntry as File;
        
        // Validar tamaño máximo de 10 MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ 
                error: 'El archivo excede el tamaño máximo permitido de 10 MB' 
            }, { status: 400 });
        }

        // Verificar que el incidente existe
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId }
        });
        
        if (!incident) {
            return NextResponse.json({ 
                error: `Incidente con ID ${incidentId} no encontrado` 
            }, { status: 404 });
        }

        const fileBytes = await file.arrayBuffer();
        const buffer = Buffer.from(fileBytes);
        
        // Generar ID único
        const fileId = uuidv4();
          try {
            // Intentar usar prisma.incidentImage directamente primero
            try {
                const createdImage = await prisma.incidentImage.create({
                    data: {
                        id: fileId,
                        fileName: file.name,
                        fileType: file.type || 'application/octet-stream',
                        fileSize: file.size,
                        data: buffer,
                        incidentId: incidentId
                    }
                });
                
                console.log(`Archivo adjuntado con éxito: ${createdImage.id}`);
                return NextResponse.json({ 
                    success: true, 
                    fileId: createdImage.id,
                    message: 'Archivo adjuntado correctamente' 
                });
            } catch (prismaError: any) {
                console.error("Error al usar prisma.incidentImage:", prismaError);
                
                // Segundo intento usando SQL crudo
                console.log("Intentando con SQL crudo...");
                const currentDate = new Date();
                
                await prisma.$executeRaw`
                    INSERT INTO "IncidentImage" (
                        "id", "fileName", "fileType", "fileSize", "data", "createdAt", "incidentId"
                    ) VALUES (
                        ${fileId}, 
                        ${file.name}, 
                        ${file.type || 'application/octet-stream'}, 
                        ${file.size}, 
                        ${buffer}, 
                        ${currentDate}, 
                        ${incidentId}
                    )
                `;
                
                console.log("Archivo insertado mediante SQL crudo");
            }
            
            return NextResponse.json({ 
                success: true, 
                fileId,
                message: 'Archivo adjuntado correctamente' 
            });
        } catch (sqlError: any) {
            console.error('Error al ejecutar SQL para insertar archivo:', sqlError);
            
            return NextResponse.json({ 
                error: 'Error al guardar el archivo en la base de datos', 
                details: sqlError.message || 'Error SQL desconocido',
                solution: 'Intente reiniciar el servidor y ejecutar npx prisma generate'
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error al adjuntar archivo:', error);
        return NextResponse.json({ 
            error: 'Error al procesar la solicitud',
            details: error.message || 'Error desconocido'
        }, { status: 500 });
    }
}
