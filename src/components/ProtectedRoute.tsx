"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
    requireAuth?: boolean;
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (requireAuth && status === "unauthenticated") {
            router.replace("/login");
        }
    }, [status, router, requireAuth]);

    // Si se requiere autenticación pero no hay sesión y ya se verificó el estado
    if (requireAuth && status === "unauthenticated") {
        return null; // No renderizar nada mientras se redirige
    }

    // Mostrar loading mientras se verifica la sesión
    if (requireAuth && status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    // Si se requiere autenticación pero no hay sesión
    if (requireAuth && !session) {
        return null;
    }

    return <>{children}</>;
}
