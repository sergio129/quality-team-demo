'use client';

import { useState } from 'react';
import { QAAnalyst } from '@/models/QAAnalyst';
import { 
  createAnalystVacation, 
  deleteAnalystVacation,
  useAnalystVacations
} from '@/hooks/useAnalystVacations';
import { Calendar, X, Info, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/incidents/ConfirmDialog';
import { getWorkingDaysBetweenDates, isNonWorkingDay, isHoliday } from '@/utils/dateUtils';

// Función helper para crear fechas de manera segura desde strings
function createSafeDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return dateString;
  }
  
  // Si es un string en formato ISO (YYYY-MM-DD), crear fecha de manera precisa
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // Mes es 0-indexado
  }
  
  // Fallback para otros formatos
  return new Date(dateString);
}

// Función para calcular días calendario entre dos fechas (incluyendo ambos días)
function calcularDiasCalendario(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Establecer ambas fechas a medianoche para comparar solo días
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Calcular diferencia en milisegundos y convertir a días
  // Agregar 1 para incluir ambos días (inicio y fin)
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

interface AnalystVacationsManagementProps {
  analyst: QAAnalyst;
}

export function AnalystVacationsManagement({ analyst }: Readonly<AnalystVacationsManagementProps>) {
  const { vacations, isLoading } = useAnalystVacations();
  const [showForm, setShowForm] = useState(false);  const [newVacation, setNewVacation] = useState({
    analystId: analyst.id,
    type: 'vacation' as 'vacation' | 'leave' | 'training' | 'other',
    startDate: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD para inputs date
    endDate: new Date().toISOString().split('T')[0],   // Formato YYYY-MM-DD para inputs date
    description: ''
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
      const startDate = createSafeDate(newVacation.startDate);
      const endDate = createSafeDate(newVacation.endDate);
      
      // Validar fechas
      if (startDate > endDate) {
        toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
        return;
      }
      
      // Validar que no sea una fecha pasada
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Solo validar fechas en el pasado si es de tipo "vacaciones"
      if (newVacation.type === 'vacation' && startDate < today) {
        // Permitimos registrar vacaciones pasadas, pero mostramos una advertencia
        toast.warning('Estás registrando vacaciones con fecha en el pasado');
      }
      
      // Verificar que haya al menos 1 día hábil
      const diasHabiles = getWorkingDaysBetweenDates(startDate, endDate);
      if (diasHabiles < 1) {
        toast.error('El período debe incluir al menos un día hábil');
        return;
      }
      
      await createAnalystVacation({
        analystId: analyst.id,
        startDate,
        endDate,
        description: newVacation.description,
        type: newVacation.type
      });
      
      // Resetear formulario
      setShowForm(false);      setNewVacation({
        analystId: analyst.id,
        type: 'vacation' as const,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        description: ''
      });
    } catch (error) {
      console.error('Error al crear vacaciones:', error);
    }
  };
    // Estado para el diálogo de confirmación
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [vacationToDelete, setVacationToDelete] = useState<string | null>(null);

  // Eliminar un período de vacaciones
  const handleDelete = async (id: string) => {
    setVacationToDelete(id);
    setConfirmDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (vacationToDelete) {
      try {
        await deleteAnalystVacation(vacationToDelete);
        setConfirmDialogOpen(false);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">            <div>
              <label htmlFor="tipoAusencia" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de ausencia
              </label>
              <select
                id="tipoAusencia"
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
              <label htmlFor="descripcionAusencia" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <input
                id="descripcionAusencia"
                type="text"
                value={newVacation.description ?? ''}
                onChange={(e) => setNewVacation({ ...newVacation, description: e.target.value })}
                placeholder="Ej: Vacaciones de verano"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">            <div>
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio
              </label>
              <input
                id="fechaInicio"
                type="date"
                value={newVacation.startDate}
                onChange={(e) => setNewVacation({ ...newVacation, startDate: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de fin
              </label>
              <input
                id="fechaFin"
                type="date"
                value={newVacation.endDate}
                onChange={(e) => setNewVacation({ ...newVacation, endDate: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
          </div>          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Resumen del período</h4>
            
            {newVacation.startDate && newVacation.endDate && (() => {
              const startDate = createSafeDate(newVacation.startDate);
              const endDate = createSafeDate(newVacation.endDate);
              
              const diasHabiles = getWorkingDaysBetweenDates(startDate, endDate);
              const diasCalendario = calcularDiasCalendario(startDate, endDate);
              const finesDeSemana = diasCalendario - diasHabiles;
              
              // Calcular el porcentaje para la barra visual
              const porcentajeDiasHabiles = Math.round((diasHabiles / diasCalendario) * 100);
              
              // Determinar si el periodo es válido
              const fechaInvalida = startDate > endDate;
              
              return (
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Días hábiles:</p>
                      <p className={`text-lg font-semibold ${fechaInvalida ? 'text-red-600' : 'text-blue-600'}`}>
                        {fechaInvalida ? '0' : diasHabiles}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Días calendario:</p>
                      <p className="text-lg font-semibold">
                        {fechaInvalida ? '0' : diasCalendario}
                      </p>
                    </div>
                  </div>
                  
                  {!fechaInvalida && (
                    <>
                      <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600" 
                          style={{ width: `${porcentajeDiasHabiles}%` }}
                        ></div>
                      </div>
                      
                      <div className="mt-2 flex justify-between text-sm text-gray-500">
                        <span>Días hábiles: {diasHabiles}</span>
                        <span>Fines de semana: {finesDeSemana}</span>
                      </div>
                    </>
                  )}
                  
                  {fechaInvalida && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      ¡Fechas inválidas! La fecha de inicio debe ser anterior a la fecha de fin.
                    </p>
                  )}
                </div>
              );
            })()}
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
          
          <div className="overflow-hidden border rounded-lg">            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Período
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                    Días
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analystVacations.map((vacation) => (
                  <tr key={vacation.id} className="hover:bg-gray-50">                    <td className="px-4 py-2">
                      {(() => {
                        // Determinar la clase para el badge según el tipo
                        let badgeClass = '';
                        let badgeLabel = '';
                        
                        switch(vacation.type) {
                          case 'vacation':
                            badgeClass = 'bg-purple-100 text-purple-800';
                            badgeLabel = 'Vacaciones';
                            break;
                          case 'training':
                            badgeClass = 'bg-green-100 text-green-800';
                            badgeLabel = 'Capacitación';
                            break;
                          case 'leave':
                            badgeClass = 'bg-yellow-100 text-yellow-800';
                            badgeLabel = 'Permiso';
                            break;
                          default:
                            badgeClass = 'bg-gray-100 text-gray-800';
                            badgeLabel = 'Otro';
                        }
                        
                        return (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {vacation.description ?? <span className="text-gray-400 italic">Sin descripción</span>}
                    </td>                    <td className="px-4 py-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        <span>{formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}</span>
                      </div>
                    </td>                    <td className="px-4 py-2">
                      <div className="flex flex-col items-center">
                        {/* Contadores de días */}
                        <div className="flex justify-between w-full mb-1">
                          <span className="font-semibold text-blue-600 text-sm">
                            {getWorkingDaysBetweenDates(createSafeDate(vacation.startDate), createSafeDate(vacation.endDate))} hábiles
                          </span>
                          <span className="text-gray-500 text-sm">
                            {calcularDiasCalendario(createSafeDate(vacation.startDate), createSafeDate(vacation.endDate))} calendario
                          </span>
                        </div>
                        
                        {/* Barra visual mejorada */}
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600" 
                            style={{ 
                              width: `${Math.round((getWorkingDaysBetweenDates(createSafeDate(vacation.startDate), createSafeDate(vacation.endDate)) / 
                                calcularDiasCalendario(createSafeDate(vacation.startDate), createSafeDate(vacation.endDate))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        
                        {/* Leyenda */}
                        <div className="flex justify-between w-full mt-1 text-xs">
                          <span className="text-blue-600">Laborables</span>
                          <span className="text-gray-500">Total</span>
                        </div>
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
          </div>        </div>
      )}
      
      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        title="Confirmación"
        message="¿Estás seguro de que deseas eliminar este período de vacaciones?"
        confirmLabel="Aceptar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </div>
  );
}
