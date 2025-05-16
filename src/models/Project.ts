export interface Project {
    id?: string;
    idJira: string;
    nombre?: string;
    proyecto: string;
    equipo: string;
    celula: string;
    horas: number;
    dias: number;
    horasEstimadas?: number;
    estado?: string;
    estadoCalculado?: 'Por Iniciar' | 'En Progreso' | 'Certificado';  // Estado calculado automáticamente
    descripcion?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
    fechaEntrega: Date;
    fechaRealEntrega?: Date;
    fechaCertificacion?: Date;
    diasRetraso: number;
    analistaProducto: string;
    planTrabajo: string;
    analistas?: string[];  // Array de IDs de analistas asignados al proyecto
}

export type ProjectStatus = 'pendiente' | 'en_progreso' | 'completado' | 'retrasado';

export interface ProjectWithStatus extends Project {
    status: ProjectStatus;
}
