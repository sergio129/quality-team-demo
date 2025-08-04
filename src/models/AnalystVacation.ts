 // Modelo para las vacaciones de los analistas
export interface AnalystVacation {
    id: string;          // ID único de este período de vacaciones
    analystId: string;   // ID del analista al que pertenecen las vacaciones
    startDate: string | Date;     // Fecha de inicio de las vacaciones (puede ser string ISO o Date)
    endDate: string | Date;       // Fecha de fin de las vacaciones (puede ser string ISO o Date)
    description?: string; // Descripción opcional (ej: "Vacaciones de verano", "Permiso especial")
    type: 'vacation' | 'leave' | 'training' | 'other'; // Tipo de ausencia
}
