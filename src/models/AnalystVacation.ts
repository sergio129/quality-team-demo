// Modelo para las vacaciones de los analistas QA
export interface AnalystVacation {
    id: string;          // ID único de este período de vacaciones
    analystId: string;   // ID del analista al que pertenecen las vacaciones
    startDate: Date;     // Fecha de inicio de las vacaciones
    endDate: Date;       // Fecha de fin de las vacaciones
    description?: string; // Descripción opcional (ej: "Vacaciones de verano", "Permiso especial")
    type: 'vacation' | 'leave' | 'training' | 'other'; // Tipo de ausencia
}
