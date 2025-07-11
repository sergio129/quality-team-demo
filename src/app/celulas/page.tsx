"use client";

import React, { useEffect } from 'react';
import { DataTable } from '@/components/cells/CellTable';
import { AddCellButton } from '@/components/cells/AddCellButton';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CellsPage() {
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
            <h1 className="text-2xl font-bold">Gestión de Células</h1>
            <p className="text-muted-foreground">
              Administre las células de trabajo y sus asignaciones a equipos
            </p>
          </div>
          <AddCellButton />
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tabla principal (ocupa 3/4 del ancho en desktop) */}
          <div className="md:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">Listado de Células</h2>
              </div>
              <div className="p-4">
                <DataTable />
              </div>
            </div>
          </div>

          {/* Panel lateral (ocupa 1/4 del ancho en desktop) */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-medium mb-4">Información</h2>
              <div className="text-sm text-muted-foreground">
                <p>
                  Las células son unidades de trabajo específicas dentro de cada equipo.
                  Permiten organizar las tareas y proyectos en grupos temáticos.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Cree células para categorizar proyectos</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Asigne cada célula a un equipo específico</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Agrupe proyectos relacionados en la misma célula</span>
                  </div>
                </div>
              </div>
            </div>            <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-4">
              <h3 className="font-medium text-green-800 mb-2">Funcionalidades</h3>
              <div className="text-sm space-y-3">
                <div>
                  <div className="font-medium text-green-700 flex items-center">
                    <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Visualización de proyectos por célula
                  </div>
                  <p className="text-gray-600 text-xs pl-5 mt-1">
                    Revise todos los proyectos asignados a cada célula
                  </p>
                </div>
                
                <div className="text-green-700 space-y-1 pt-2 border-t border-green-200">
                  <h4 className="font-medium">Próximamente:</h4>
                  <ul className="space-y-1">
                    <li>• Asignación de analistas a células</li>
                    <li>• Métricas de rendimiento por célula</li>
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
