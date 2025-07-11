"use client";

import { IncidentTable } from '@/components/incidents/IncidentTable';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function IncidentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Mostrar loading mientras se verifica la sesión
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    // Si no hay sesión, no mostrar nada (se redirigirá)
    if (!session) {
        return null;
    }

    return (
        <div className="container mx-auto py-8 px-4">            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Sistema de Seguimiento de Incidentes</h1>
                    <p className="text-gray-600">Gestión y seguimiento de incidencias y defectos</p>
                </div>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                    <IncidentTable />
                </div>
                <div className="md:col-span-1">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 flex flex-col space-y-4">
                            <h3 className="text-lg font-semibold">Información</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium">Gestión de Incidentes</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Registra y gestiona el seguimiento de incidencias, bugs y defectos en tus proyectos.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">Estados</h4>
                                    <div className="flex flex-col space-y-1 mt-1">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                            <span className="text-xs">Abierto</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                                            <span className="text-xs">En Progreso</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                            <span className="text-xs">Resuelto</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">Métricas</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Visualiza estadísticas y tendencias para mejorar la calidad del software.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">Exportación</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Exporta los datos de incidentes a Excel para realizar análisis detallados.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
