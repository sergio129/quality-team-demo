'use client';

import { useTestCaseStats } from '@/hooks/useTestCases';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface TestCaseStatsProps {
  projectId: string;
  testPlanId?: string;
}

export default function TestCaseStats({ projectId, testPlanId }: TestCaseStatsProps) {
  const { stats, isLoading } = useTestCaseStats(projectId, testPlanId);

  // En lugar de usar useState y useEffect, usamos directamente stats.cycleStats
  const cycleStats = stats?.cycleStats || {};

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-md"></div>
        <div className="h-56 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  const cycles = Object.keys(cycleStats).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Casos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Exitosos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.statusStats?.Exitoso || 0}</div>
            <Progress 
              value={(stats.statusStats?.Exitoso || 0) / (stats.totalCases || 1) * 100} 
              className="h-2 mt-2 bg-gray-200"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Fallidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.statusStats?.Fallido || 0}</div>
            <Progress 
              value={(stats.statusStats?.Fallido || 0) / (stats.totalCases || 1) * 100} 
              className="h-2 mt-2 bg-gray-200"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">No Ejecutados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.statusStats?.['No ejecutado'] || 0}</div>
            <Progress 
              value={(stats.statusStats?.['No ejecutado'] || 0) / (stats.totalCases || 1) * 100} 
              className="h-2 mt-2 bg-gray-200"
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Estadísticas por ciclo */}
      {cycles.length > 0 && (
        <div className="border rounded-lg p-5 bg-white">
          <h3 className="text-lg font-bold mb-4">Ciclos de Prueba</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs text-gray-500">
                  <th className="text-left pb-2">Ciclo</th>
                  <th className="text-left pb-2">Diseñados</th>
                  <th className="text-left pb-2">Exitosos</th>
                  <th className="text-left pb-2">No Ejecutados</th>
                  <th className="text-left pb-2">Defectos</th>
                  <th className="text-left pb-2">% Éxito</th>
                  <th className="text-left pb-2">% Incidentes</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((cycle) => {
                  const cycleData = cycleStats[cycle];
                  const successRate = cycleData.designed > 0 ? Math.round((cycleData.successful / cycleData.designed) * 100) : 0;
                  const incidentRate = cycleData.designed > 0 ? Math.round((cycleData.defects / cycleData.designed) * 100) : 0;
                  
                  return (
                    <tr key={cycle} className="border-b">
                      <td className="py-3">Ciclo {cycle}</td>
                      <td className="py-3">{cycleData.designed}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {cycleData.successful}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          {cycleData.notExecuted}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          {cycleData.defects}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${successRate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{successRate}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-full bg-red-500 rounded-full" 
                              style={{ width: `${incidentRate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{incidentRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Totales */}
                <tr className="bg-gray-50 font-medium">
                  <td className="py-3">Total</td>
                  <td className="py-3">
                    {cycles.reduce((acc, cycle) => acc + cycleStats[cycle].designed, 0)}
                  </td>
                  <td className="py-3">
                    {cycles.reduce((acc, cycle) => acc + cycleStats[cycle].successful, 0)}
                  </td>
                  <td className="py-3">
                    {cycles.reduce((acc, cycle) => acc + cycleStats[cycle].notExecuted, 0)}
                  </td>
                  <td className="py-3">
                    {cycles.reduce((acc, cycle) => acc + cycleStats[cycle].defects, 0)}
                  </td>
                  <td className="py-3">
                    {Math.round(
                      (cycles.reduce((acc, cycle) => acc + cycleStats[cycle].successful, 0) / 
                      cycles.reduce((acc, cycle) => acc + cycleStats[cycle].designed, 0)) * 100
                    )}%
                  </td>
                  <td className="py-3">
                    {Math.round(
                      (cycles.reduce((acc, cycle) => acc + cycleStats[cycle].defects, 0) / 
                      cycles.reduce((acc, cycle) => acc + cycleStats[cycle].designed, 0)) * 100
                    )}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
