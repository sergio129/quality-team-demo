"use client";

import { useState } from "react";
import ProjectTable from '@/components/ProjectTable';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

// Componente de Loading Skeleton más elegante y realista
function ProjectsLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 animate-pulse">
            <div className="max-w-[95%] mx-auto py-6">
                {/* Header Skeleton */}
                <div className="mb-6">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
                
                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-lg shadow p-4">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                    ))}
                </div>
                
                {/* Filters Skeleton */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap gap-4 mb-4">
                        <div className="h-10 bg-gray-200 rounded w-48"></div>
                        <div className="h-10 bg-gray-200 rounded w-32"></div>
                        <div className="h-10 bg-gray-200 rounded w-32"></div>
                        <div className="h-10 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                </div>
                
                {/* Table Skeleton */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="p-4 space-y-3">
                            {/* Table Headers */}
                            <div className="grid grid-cols-6 gap-4 pb-2 border-b">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                            {/* Table Rows */}
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="grid grid-cols-6 gap-4">
                                    <div className="h-4 bg-gray-100 rounded"></div>
                                    <div className="h-4 bg-gray-100 rounded"></div>
                                    <div className="h-4 bg-gray-100 rounded"></div>
                                    <div className="h-4 bg-gray-100 rounded"></div>
                                    <div className="h-4 bg-gray-100 rounded"></div>
                                    <div className="h-4 bg-gray-100 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProyectosPage() {
    const { session, status, isInitialLoading } = useOptimizedAuth();
    
    // Mostrar skeleton solo durante la carga inicial real
    if (isInitialLoading) {
        return <ProjectsLoadingSkeleton />;
    }

    // Si no hay sesión después de la carga, no mostrar nada (se redirigirá)
    if (status === 'unauthenticated' || !session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[95%] mx-auto py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Seguimiento de Proyectos
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Bienvenido, {session.user?.name || session.user?.email}
                    </p>
                </div>
                <ProjectTable />
            </div>
        </div>
    );
}
