'use client';

import { useState } from 'react';
import { QAAnalyst } from '@/models/QAAnalyst';
import { AnalystVacation } from '@/models/AnalystVacation';
import { 
  createAnalystVacation, 
  deleteAnalystVacation,
  useAnalystVacations
} from '@/hooks/useAnalystVacations';
import { Calendar, X, Info, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface AnalystVacationsManagementProps {
  analyst: QAAnalyst;
}

export function AnalystVacationsManagement({ analyst }: AnalystVacationsManagementProps) {
  const { vacations, isLoading } = useAnalystVacations();
  const [showForm, setShowForm] = useState(false);
  const [newVacation, setNewVacation] = useState<Partial<AnalystVacation>>({
    analystId: analyst.id,
    type: 'vacation',
    startDate: new Date(),
    endDate: new Date()
  });

  // Filtrar vacaciones solo para este analista
  const analystVacations = vacations.filter(v => v.analystId === analyst.id);
  
  // Función para formatear fechas
  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC'
    });
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validar fechas
      if (new Date(newVacation.startDate!) > new Date(newVacation.endDate!)) {
        toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
        return;
      }
      
      await createAnalystVacation({
        analystId: analyst.id,
        startDate: new Date(newVacation.startDate!),
        endDate: new Date(newVacation.endDate!),
        description: newVacation.description || '',
        type: newVacation.type as 'vacation' | 'leave' | 'training' | 'other'
      });
      
      // Resetear formulario
      setShowForm(false);
      setNewVacation({
        analystId: analyst.id,
        type: 'vacation',
        startDate: new Date(),
        endDate: new Date()
      });
    } catch (error) {
      console.error('Error al crear vacaciones:', error);
    }
  };
  
  // Eliminar un período de vacaciones
  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este período de vacaciones?')) {
      try {
        await deleteAnalystVacation(id);
      } catch (error) {
        console.error('Error al eliminar vacaciones:', error);
      }
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Gestión de Ausencias - {analyst.name}
        </h3>
        <button 
          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Añadir Período'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de ausencia
              </label>
              <select
                value={newVacation.type}
                onChange={(e) => setNewVacation({ ...newVacation, type: e.target.value as any })}
                className="w-full border rounded-md px-3 py-2"
                required
              >
                <option value="vacation">Vacaciones</option>
                <option value="leave">Permiso</option>
                <option value="training">Capacitación</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={newVacation.description || ''}
                onChange={(e) => setNewVacation({ ...newVacation, description: e.target.value })}
                placeholder="Ej: Vacaciones de verano"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={newVacation.startDate instanceof Date 
                  ? newVacation.startDate.toISOString().split('T')[0] 
                  : newVacation.startDate as string}
                onChange={(e) => setNewVacation({ ...newVacation, startDate: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de fin
              </label>
              <input
                type="date"
                value={newVacation.endDate instanceof Date
                  ? newVacation.endDate.toISOString().split('T')[0]
                  : newVacation.endDate as string}
                onChange={(e) => setNewVacation({ ...newVacation, endDate: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center p-4">
          <span>Cargando períodos de ausencia...</span>
        </div>
      ) : analystVacations.length === 0 ? (
        <div className="text-center p-4 text-gray-500">
          <UserMinus className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p>No hay períodos de ausencia registrados para este analista</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-blue-50 p-3 rounded-lg flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Los períodos de ausencia se mostrarán automáticamente en la vista de calendario. 
              No es necesario crear proyectos ficticios para representar vacaciones.
            </p>
          </div>
          
          <div className="overflow-hidden border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analystVacations.map((vacation) => (
                  <tr key={vacation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vacation.type === 'vacation' 
                          ? 'bg-purple-100 text-purple-800' 
                          : vacation.type === 'training'
                          ? 'bg-green-100 text-green-800'
                          : vacation.type === 'leave'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {vacation.type === 'vacation' && 'Vacaciones'}
                        {vacation.type === 'training' && 'Capacitación'}
                        {vacation.type === 'leave' && 'Permiso'}
                        {vacation.type === 'other' && 'Otro'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {vacation.description || <span className="text-gray-400 italic">Sin descripción</span>}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        <span>{formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDelete(vacation.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
