'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Team } from '@/models/Team';
import { QAAnalyst } from '@/models/QAAnalyst';
import { useAnalysts } from '@/hooks/useAnalysts';
import { updateTeam } from '@/hooks/useTeams';
import { toast } from 'sonner';

interface TeamMembersDialogProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamMembersDialog({ team, isOpen, onClose }: TeamMembersDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { analysts, isLoading } = useAnalysts();

  // Inicializar con los miembros actuales del equipo
  useEffect(() => {
    if (team.members) {
      setSelectedMembers(team.members);
    } else {
      setSelectedMembers([]);
    }
  }, [team.members]);

  // Filtrar analistas por término de búsqueda
  const filteredAnalysts = analysts.filter(analyst => 
    analyst.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar la selección/deselección de miembros
  const toggleMember = (analystId: string) => {
    setSelectedMembers(prev => 
      prev.includes(analystId) 
        ? prev.filter(id => id !== analystId)
        : [...prev, analystId]
    );
  };

  // Guardar los cambios
  const handleSave = useCallback(async () => {
    try {
      await updateTeam(team.id, {
        ...team,
        members: selectedMembers
      });
      toast.success('Miembros del equipo actualizados');
      onClose();
    } catch (error) {
      toast.error('Error al actualizar los miembros del equipo');
    }
  }, [team, selectedMembers, onClose]);

  const getAnalystName = (analystId: string) => {
    const analyst = analysts.find(a => a.id === analystId);
    return analyst ? analyst.name : 'Analista desconocido';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Miembros al Equipo: {team.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Búsqueda */}
          <div className="flex items-center border rounded-md">
            <input
              type="text"
              placeholder="Buscar analistas..."
              className="w-full px-3 py-2 border-0 focus:outline-none rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Lista de analistas */}
          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            {isLoading ? (
              <div className="text-center py-4">Cargando analistas...</div>
            ) : filteredAnalysts.length === 0 ? (
              <div className="text-center py-4">No se encontraron analistas</div>
            ) : (
              <ul className="divide-y">
                {filteredAnalysts.map(analyst => (
                  <li 
                    key={analyst.id} 
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleMember(analyst.id)}
                  >
                    <input
                      type="checkbox"
                      className="mr-3 h-4 w-4"
                      checked={selectedMembers.includes(analyst.id)}
                      onChange={() => {}}
                    />
                    <div>
                      <div className="font-medium">{analyst.name}</div>
                      <div className="text-xs text-gray-500">{analyst.email} • {analyst.role}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Miembros seleccionados */}
          <div>
            <h4 className="text-sm font-medium mb-2">Miembros seleccionados ({selectedMembers.length})</h4>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map(memberId => (
                <div 
                  key={memberId} 
                  className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center"
                >
                  {getAnalystName(memberId)}
                  <button 
                    className="ml-1 hover:text-red-500"
                    onClick={() => toggleMember(memberId)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedMembers.length === 0 && (
                <div className="text-sm text-gray-500">No hay miembros seleccionados</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
