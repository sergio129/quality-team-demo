'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TestPlan } from '@/models/TestCase';
import { useProjects } from '@/hooks/useProjects';

interface SelectTestPlanProps {
  testPlans: TestPlan[];
  onSelectPlan: (planId: string) => void;
  selectedPlanId?: string;
}

export default function SelectTestPlan({ testPlans, onSelectPlan, selectedPlanId }: SelectTestPlanProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { projects } = useProjects();
  const inputRef = useRef<HTMLInputElement>(null);

  // Agrupar planes por proyecto
  const groupedPlans = testPlans.reduce((groups: Record<string, TestPlan[]>, plan) => {
    const projectId = plan.projectId;
    if (!groups[projectId]) {
      groups[projectId] = [];
    }
    groups[projectId].push(plan);
    return groups;
  }, {});

  // Cerrar desplegable al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrar planes según término de búsqueda
  const filteredPlans = testPlans.filter(plan => {
    const searchLower = searchTerm.toLowerCase();
    return (
      plan.codeReference.toLowerCase().includes(searchLower) ||
      plan.projectName.toLowerCase().includes(searchLower)
    );
  });

  // Obtener nombre del plan seleccionado
  const selectedPlanName = selectedPlanId ? 
    testPlans.find(p => p.id === selectedPlanId)?.codeReference || 'Plan seleccionado' : 
    'Todos los planes';

  // Manejar selección de plan
  const handleSelectPlan = (planId: string) => {
    onSelectPlan(planId);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  // Abrir desplegable y enfocar input de búsqueda
  const handleOpenDropdown = () => {
    setIsDropdownOpen(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Organizar proyectos por orden alfabético
  const sortedProjectIds = Object.keys(groupedPlans).sort((a, b) => {
    const projectA = projects.find(p => p.idJira === a)?.proyecto || '';
    const projectB = projects.find(p => p.idJira === b)?.proyecto || '';
    return projectA.localeCompare(projectB);
  });
  return (
    <div className="relative space-y-2" ref={dropdownRef}>
      <label className="text-sm font-medium">Plan de pruebas</label>
      {/* Botón para mostrar el desplegable */}
      <button
        type="button"
        className="flex justify-between items-center w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-white"
        onClick={handleOpenDropdown}
      >
        <span className="truncate">{selectedPlanName}</span>
        <span className="ml-1">▼</span>
      </button>
      
      {/* Desplegable con barra de búsqueda y planes agrupados */}
      {isDropdownOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-20">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                ref={inputRef}
                placeholder="Buscar plan de prueba..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Lista de planes con scroll */}
          <div className="overflow-y-auto max-h-80">
            {searchTerm ? (
              // Mostrar resultados de búsqueda
              filteredPlans.length > 0 ? (
                <div className="py-1">
                  {filteredPlans.map((plan) => (
                    <button
                      key={plan.id}
                      className={`block w-full px-4 py-2 text-left hover:bg-gray-100 ${
                        selectedPlanId === plan.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      <span className="font-medium">{plan.codeReference}</span> - {plan.projectName}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-2 px-4 text-gray-500 text-center">No se encontraron planes</div>
              )
            ) : (
              // Mostrar planes agrupados por proyecto
              <div>
                <button
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 bg-gray-50 font-medium"
                  onClick={() => handleSelectPlan('')}
                >
                  Todos los planes
                </button>
                {sortedProjectIds.map((projectId) => {
                  const projectName = projects.find(p => p.idJira === projectId)?.proyecto || 'Proyecto';
                  return (
                    <div key={projectId} className="border-t border-gray-100">
                      <div className="px-4 py-1 bg-gray-50 text-xs text-gray-500 font-medium">
                        {projectName}
                      </div>
                      {groupedPlans[projectId]
                        .sort((a, b) => a.codeReference.localeCompare(b.codeReference))
                        .map((plan) => (
                          <button
                            key={plan.id}
                            className={`block w-full px-4 py-2 text-left hover:bg-gray-100 ${
                              selectedPlanId === plan.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                            }`}
                            onClick={() => handleSelectPlan(plan.id)}
                          >
                            {plan.codeReference}
                          </button>
                        ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
