'use client';

import { useState } from 'react';
import { QAAnalyst } from '@/models/QAAnalyst';
import { 
  createAnalystVacation, 
  deleteAnalystVacation,
  useAnalystVacations
} from '@/hooks/useAnalystVacations';
import { 
  Calendar, 
  X, 
  Info, 
  UserMinus, 
  Plane, 
  Heart, 
  Clock, 
  MapPin,
  TrendingUp,
  BarChart3,
  Plus
} from 'lucide-react';
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

// Función para calcular días restantes y estado de la ausencia
function calcularEstadoAusencia(startDate: Date, endDate: Date) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const inicio = new Date(startDate);
  inicio.setHours(0, 0, 0, 0);
  
  const fin = new Date(endDate);
  fin.setHours(0, 0, 0, 0);
  
  if (hoy < inicio) {
    // Ausencia futura
    const diasHastaInicio = Math.ceil((inicio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return {
      estado: 'pendiente',
      mensaje: `Comienza en ${diasHastaInicio} día${diasHastaInicio !== 1 ? 's' : ''}`,
      diasRestantes: diasHastaInicio,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: '📅'
    };
  } else if (hoy >= inicio && hoy <= fin) {
    // Ausencia activa
    const diasRestantes = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diasRestantes === 0) {
      return {
        estado: 'ultimo_dia',
        mensaje: '¡Último día de ausencia!',
        diasRestantes: 0,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: '⚠️'
      };
    }
    return {
      estado: 'activa',
      mensaje: `Regresa en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`,
      diasRestantes: diasRestantes,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '🏖️'
    };
  } else {
    // Ausencia finalizada
    const diasPasados = Math.floor((hoy.getTime() - fin.getTime()) / (1000 * 60 * 60 * 24));
    return {
      estado: 'finalizada',
      mensaje: `Finalizó hace ${diasPasados} día${diasPasados !== 1 ? 's' : ''}`,
      diasRestantes: -diasPasados,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: '✅'
    };
  }
}

// Configuración de tipos de ausencia con iconos y colores
const vacationTypeConfig = {
  Vacaciones: {
    icon: Plane,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    label: '🏖️ Vacaciones'
  },
  Permiso: {
    icon: Clock,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    label: '⏰ Permiso'
  },
  'Incapacidad Médica': {
    icon: Heart,
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    label: '🏥 Incapacidad'
  },
  Otro: {
    icon: MapPin,
    color: 'bg-gray-500',
    lightColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    label: '📝 Otro'
  }
};

// Función para obtener configuración de tipo
function getVacationTypeConfig(type: string) {
  return vacationTypeConfig[type as keyof typeof vacationTypeConfig] || vacationTypeConfig.Otro;
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
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 space-y-6">
      {/* Header mejorado */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Gestión de Ausencias
            </h3>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <UserMinus className="h-4 w-4 mr-1" />
              {analyst.name}
            </p>
          </div>
        </div>
        <button 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
            showForm 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md'
          }`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              <span>Cancelar</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Añadir Período</span>
            </>
          )}
        </button>
      </div>

      {/* Panel de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(vacationTypeConfig).map(([type, config]) => {
          const typeVacations = analystVacations.filter(v => {
            const mappedType = 
              v.type === 'vacation' ? 'Vacaciones' :
              v.type === 'leave' ? 'Permiso' :
              v.type === 'training' ? 'Incapacidad Médica' :
              'Otro';
            return mappedType === type;
          });
          
          const totalDays = typeVacations.reduce((sum, vacation) => {
            const startDate = createSafeDate(vacation.startDate);
            const endDate = createSafeDate(vacation.endDate);
            return sum + calcularDiasCalendario(startDate, endDate);
          }, 0);

          const IconComponent = config.icon;

          return (
            <div key={type} className={`${config.lightColor} ${config.borderColor} border-2 rounded-lg p-4 transition-transform hover:scale-105`}>
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`h-5 w-5 ${config.textColor}`} />
                <span className={`text-2xl font-bold ${config.textColor}`}>{totalDays}</span>
              </div>
              <p className={`text-sm font-medium ${config.textColor}`}>{config.label}</p>
              <p className="text-xs text-gray-500 mt-1">
                {typeVacations.length} período{typeVacations.length !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </div>

      {/* Resumen anual */}
      {analystVacations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Resumen Anual {new Date().getFullYear()}
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {analystVacations.reduce((sum, vacation) => {
                  const startDate = createSafeDate(vacation.startDate);
                  const endDate = createSafeDate(vacation.endDate);
                  return sum + getWorkingDaysBetweenDates(startDate, endDate);
                }, 0)}
              </div>
              <div className="text-sm text-indigo-700 font-medium">Total días laborables</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analystVacations.reduce((sum, vacation) => {
                  const startDate = createSafeDate(vacation.startDate);
                  const endDate = createSafeDate(vacation.endDate);
                  return sum + calcularDiasCalendario(startDate, endDate);
                }, 0)}
              </div>
              <div className="text-sm text-purple-700 font-medium">Total días calendario</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analystVacations.length}</div>
              <div className="text-sm text-green-700 font-medium">Períodos registrados</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {Math.round((analystVacations.reduce((sum, vacation) => {
                  const startDate = createSafeDate(vacation.startDate);
                  const endDate = createSafeDate(vacation.endDate);
                  return sum + getWorkingDaysBetweenDates(startDate, endDate);
                }, 0) / 250) * 100)}%
              </div>
              <div className="text-sm text-orange-700 font-medium">Del año laboral (250 días)</div>
            </div>
          </div>
        </div>
      )}

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
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg flex items-start border border-blue-200">
            <Info className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Los períodos de ausencia se mostrarán automáticamente en la vista de calendario. 
              No es necesario crear proyectos ficticios para representar vacaciones.
            </p>
          </div>
          
          {/* Cards de ausencias con estado dinámico */}
          <div className="grid gap-4">
            {analystVacations.map((vacation) => {
              // Mapear el tipo de vacation a nuestros tipos configurados
              const mappedType = 
                vacation.type === 'vacation' ? 'Vacaciones' :
                vacation.type === 'leave' ? 'Permiso' :
                vacation.type === 'training' ? 'Incapacidad Médica' :
                'Otro';
              
              const config = getVacationTypeConfig(mappedType);
              const IconComponent = config.icon;
              
              const startDate = createSafeDate(vacation.startDate);
              const endDate = createSafeDate(vacation.endDate);
              const diasHabiles = getWorkingDaysBetweenDates(startDate, endDate);
              const diasCalendario = calcularDiasCalendario(startDate, endDate);
              const porcentajeDiasHabiles = Math.round((diasHabiles / diasCalendario) * 100);
              
              // Calcular estado y días restantes
              const estadoAusencia = calcularEstadoAusencia(startDate, endDate);

              return (
                <div key={vacation.id} className={`${config.lightColor} border-2 ${config.borderColor} rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 ${config.color} rounded-lg shadow-md`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h5 className={`font-semibold ${config.textColor} text-lg`}>{config.label}</h5>
                        <p className="text-sm text-gray-600">
                          {vacation.description || <span className="italic">Sin descripción</span>}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(vacation.id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="Eliminar período"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Estado dinámico con días restantes */}
                  <div className={`${estadoAusencia.bgColor} border ${estadoAusencia.borderColor} rounded-lg p-3 mb-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{estadoAusencia.icon}</span>
                        <span className={`font-semibold ${estadoAusencia.color}`}>
                          {estadoAusencia.mensaje}
                        </span>
                      </div>
                      {estadoAusencia.estado === 'activa' && (
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${estadoAusencia.color} ${estadoAusencia.bgColor} border ${estadoAusencia.borderColor}`}>
                          {estadoAusencia.diasRestantes} día{estadoAusencia.diasRestantes !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="flex items-center mb-4 text-gray-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">
                      {formatDate(vacation.startDate)} → {formatDate(vacation.endDate)}
                    </span>
                  </div>

                  {/* Métricas visuales */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${config.textColor}`}>{diasHabiles}</div>
                      <div className="text-xs text-gray-600">Días laborables</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700">{diasCalendario}</div>
                      <div className="text-xs text-gray-600">Total calendario</div>
                    </div>
                  </div>

                  {/* Barra de progreso elegante */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Laborables</span>
                      <span>{porcentajeDiasHabiles}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full ${config.color} transition-all duration-500 ease-out`}
                        style={{ width: `${porcentajeDiasHabiles}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>🏢 {diasHabiles} días</span>
                      <span>🏠 {diasCalendario - diasHabiles} fin de semana/festivos</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
