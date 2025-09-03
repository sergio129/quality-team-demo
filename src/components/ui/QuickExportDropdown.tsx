'use client';

import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import ExportToExcelButton from '../projects/ExportToExcelButton';
import { Project } from '@/models/Project';

interface QuickExportDropdownProps {
  projects: Project[];
  filteredProjects: Project[];
}

const QuickExportDropdown: React.FC<QuickExportDropdownProps> = ({ 
  projects, 
  filteredProjects 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const exportOptions = [
    {
      label: 'Exportar Vista Actual',
      description: `${filteredProjects.length} proyectos filtrados`,
      projects: filteredProjects,
      type: 'current' as const
    },
    {
      label: 'Exportar Todo',
      description: `${projects.length} proyectos completos`,
      projects: projects,
      type: 'all' as const
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md border border-green-500"
        title="Opciones de exportación rápida"
      >
        <Download size={16} />
        <span>Exportar</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar el dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <div className="py-2">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider border-b border-gray-100">
                Exportación Rápida
              </div>
              
              {exportOptions.map((option) => (
                <div key={option.type} className="px-3 py-2 hover:bg-gray-50">
                  <ExportToExcelButton
                    projects={option.projects}
                    exportFilterType="all"
                    className="w-full justify-start bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900 border-none shadow-none p-2 rounded text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1 ml-6">{option.description}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickExportDropdown;
