import { NextResponse } from 'next/server';
import { QAAnalystService } from '@/services/qaAnalystService';
import { prisma } from '@/lib/prisma';

const analystService = new QAAnalystService();

// Este endpoint es solo para uso administrativo y limpieza de datos
export async function GET() {
    try {
        // 1. Buscar analistas potencialmente creados automáticamente
        const autoCreatedAnalysts = await prisma.qAAnalyst.findMany({
            where: {
                OR: [
                    { email: { contains: '@placeholder.com' } },
                    { email: { contains: '@generado' } },
                    { email: { contains: '@auto' } },
                    { name: { startsWith: 'Analista Desconocido' } }
                ]
            }
        });

        // Si no hay analistas problemáticos, retornar éxito
        if (autoCreatedAnalysts.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No se encontraron analistas problemáticos para eliminar",
                processed: 0
            });
        }

        // 2. Para cada analista problemático
        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const analyst of autoCreatedAnalysts) {
            try {
                // Preparar resultado
                const result = {
                    id: analyst.id,
                    name: analyst.name,
                    email: analyst.email,
                    success: false,
                    message: ""
                };

                // 2.1 Buscar incidentes relacionados
                const incidentsAssigned = await prisma.incident.findMany({
                    where: { asignadoAId: analyst.id }
                });

                // 2.2 Actualizar los incidentes para usar el campo de texto
                if (incidentsAssigned.length > 0) {
                    await Promise.all(incidentsAssigned.map(incident => 
                        prisma.incident.update({
                            where: { id: incident.id },
                            data: {
                                asignadoA_text: analyst.name,
                                asignadoAId: null
                            }
                        })
                    ));
                }

                // 2.3 Buscar incidentes informados por este analista
                const incidentsReported = await prisma.incident.findMany({
                    where: { informadoPorId: analyst.id }
                });

                // 2.4 Si hay incidentes informados, necesitamos otro analista
                if (incidentsReported.length > 0) {
                    // Buscar analista alternativo (no problemático)
                    const defaultAnalyst = await prisma.qAAnalyst.findFirst({
                        where: {
                            AND: [
                                { id: { not: analyst.id } },
                                { email: { not: { contains: '@placeholder.com' } } },
                                { email: { not: { contains: '@generado' } } },
                                { name: { not: { startsWith: 'Analista Desconocido' } } }
                            ]
                        }
                    });

                    if (defaultAnalyst) {
                        // Reasignar los incidentes
                        await prisma.incident.updateMany({
                            where: { informadoPorId: analyst.id },
                            data: { informadoPorId: defaultAnalyst.id }
                        });
                    } else {
                        // No encontramos analista alternativo
                        result.success = false;
                        result.message = `No se pudo eliminar: no se encontró analista alternativo para reasignar ${incidentsReported.length} incidentes`;
                        results.push(result);
                        failCount++;
                        continue;
                    }
                }

                // 2.5 Eliminar relaciones asociadas en una transacción
                await prisma.$transaction([
                    prisma.analystCell.deleteMany({ where: { analystId: analyst.id } }),
                    prisma.skill.deleteMany({ where: { analystId: analyst.id } }),
                    prisma.certification.deleteMany({ where: { analystId: analyst.id } }),
                    prisma.specialty.deleteMany({ where: { analystId: analyst.id } }),
                    prisma.projectAnalyst.deleteMany({ where: { analystId: analyst.id } }),
                    prisma.teamAnalyst.deleteMany({ where: { analystId: analyst.id } }),
                    prisma.qAAnalyst.delete({ where: { id: analyst.id } })
                ]);

                // Si llegamos aquí, fue exitoso
                result.success = true;
                result.message = "Eliminado correctamente";
                successCount++;
                results.push(result);
            } catch (error) {
                console.error(`Error al eliminar analista ${analyst.name}:`, error);
                results.push({
                    id: analyst.id,
                    name: analyst.name,
                    email: analyst.email,
                    success: false,
                    message: error instanceof Error ? error.message : "Error desconocido"
                });
                failCount++;
            }
        }

        // 3. Retornar resultados
        return NextResponse.json({
            success: true,
            message: `Proceso completado. ${successCount} analistas eliminados, ${failCount} fallidos.`,
            processed: autoCreatedAnalysts.length,
            successful: successCount,
            failed: failCount,
            results: results
        });
    } catch (error) {
        console.error('Error en limpieza de analistas:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Error al limpiar analistas', 
            details: error instanceof Error ? error.message : 'Error desconocido' 
        }, { 
            status: 500 
        });
    }
}
