// Definición de las habilidades técnicas que puede tener un analista
export type SkillLevel = 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto';

export interface Skill {
    name: string;
    level: SkillLevel;
}

export interface Certification {
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
}

export interface QAAnalyst {
    id: string;
    name: string;
    email: string;
    cellIds: string[];  // Ahora es un array de IDs de células
    role: string;
    color?: string;  // Color para identificar al analista en la vista de seguimiento
    skills?: Skill[];  // Habilidades técnicas
    certifications?: Certification[];  // Certificaciones obtenidas
    specialties?: string[];  // Áreas de especialización (ej: "Frontend", "Mobile", "APIs")
    availability?: number;  // Porcentaje de disponibilidad (0-100)
}
