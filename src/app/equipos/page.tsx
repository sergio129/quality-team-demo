"use client";

import React from 'react';
import { DataTable } from '@/components/teams/TeamTable';
import { AddTeamButton } from '@/components/teams/AddTeamButton';
import { TeamStats } from '@/components/teams/TeamStats';
import { TeamCharts } from '@/components/teams/TeamCharts';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      <div className="grid gap-6">
        {/* Encabezado con título y descripción */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Equipos</h1>
            <p className="text-muted-foreground">
              Administre los equipos de trabajo y sus integrantes
            </p>
          </div>
          <AddTeamButton />
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tabla principal (ocupa 3/4 del ancho en desktop) */}          <div className="md:col-span-3 space-y-4">
            <TeamCharts />
            
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">Listado de Equipos</h2>
              </div>
              <div className="p-4">
                <DataTable />
              </div>
            </div>
          </div>{/* Panel lateral (ocupa 1/4 del ancho en desktop) */}
          <div className="space-y-4">
            <TeamStats />
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-medium mb-4">Información</h2>
              <div className="text-sm text-muted-foreground">
                <p>
                  Los equipos permiten organizar los proyectos y asignar analistas
                  de calidad a diferentes grupos de trabajo.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Cree equipos para cada área funcional</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Asigne miembros a cada equipo según su especialidad</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Gestione los proyectos asociados a cada equipo</span>
                  </div>
                </div>
              </div>
            </div><div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 p-4">
              <h3 className="font-medium text-blue-800 mb-2">Funcionalidades</h3>
              <div className="text-sm space-y-3">
                <div>
                  <div className="font-medium text-green-700 flex items-center">
                    <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Asignación de miembros a equipos
                  </div>
                  <p className="text-gray-600 text-xs pl-5 mt-1">
                    Gestione qué analistas forman parte de cada equipo
                  </p>
                </div>
                  <div className="font-medium text-green-700 flex items-center mt-3">
                  <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Visualización de carga de trabajo
                </div>
                <p className="text-gray-600 text-xs pl-5 mt-1">
                  Monitoree la carga de proyectos activos por equipo
                </p>

                <div className="font-medium text-green-700 flex items-center mt-3">
                  <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Gestión de proyectos por equipo
                </div>
                <p className="text-gray-600 text-xs pl-5 mt-1">
                  Visualice y administre los proyectos asignados a cada equipo
                </p>
                
                <div className="text-blue-700 space-y-1 pt-2 border-t border-blue-200 mt-3">
                  <h4 className="font-medium">Próximamente:</h4>
                  <ul className="space-y-1">
                    <li>• Métricas de rendimiento por equipo</li>
                    <li>• Distribución automática de carga de trabajo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
