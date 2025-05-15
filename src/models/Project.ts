export interface Project {
    idJira: string;
    proyecto: string;
    equipo: string;
    celula: string;
    horas: number;
    dias: number;
    fechaEntrega: Date;
    fechaRealEntrega?: Date;
    fechaCertificacion?: Date;
    diasRetraso: number;
    analistaProducto: string;
    planTrabajo: string;
}

export type ProjectStatus = 'pendiente' | 'en_progreso' | 'completado' | 'retrasado';

export interface ProjectWithStatus extends Project {
    status: ProjectStatus;
}
