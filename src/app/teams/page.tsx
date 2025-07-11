"use client";

import React, { useEffect } from 'react';
import { DataTable } from '@/components/teams/TeamTable';
import { AddTeamButton } from '@/components/teams/AddTeamButton';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TeamsPage() {
  
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teams Management</h1>
        <AddTeamButton />
      </div>
      <DataTable />
    </div>
  );
}
