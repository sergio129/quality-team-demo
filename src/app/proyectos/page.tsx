"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProjectTable from '@/components/ProjectTable';

export default function ProyectosPage() {
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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[95%] mx-auto py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Seguimiento de Proyectos
                    </h1>
                </div>
                <ProjectTable />
            </div>
        </div>
    );
}
