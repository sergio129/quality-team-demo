export interface StateChange {
    estado: string;
    fecha: Date;
    comentario?: string;
}

export type BugType = 'UI' | 'Funcional' | 'Performance' | 'Seguridad' | 'Base de Datos' | 'Integración' | 'Otro';
export type AreaAfectada = 'Frontend' | 'Backend' | 'Base de Datos' | 'API' | 'Infraestructura' | 'Integración' | 'Otro';

export interface IncidentFile {
    id?: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    data: string | ArrayBuffer; // Base64 o ArrayBuffer para el frontend
    createdAt?: Date;
}

// Mantenemos el nombre de la interfaz anterior por compatibilidad
export interface IncidentImage extends IncidentFile {}

export interface Incident {
    id: string;
    celula: string;
    estado: string;
    prioridad: string;
    descripcion: string;
    fechaCreacion: Date;
    fechaReporte: Date;    // Nueva fecha de reporte obligatoria
    fechaSolucion?: Date;
    informadoPor: string;
    asignadoA: string;
    diasAbierto: number;
    esErroneo: boolean;
    aplica: boolean;
    cliente: string;
    idJira: string;    // Nuevos campos para categorización
    tipoBug?: BugType;
    areaAfectada?: AreaAfectada;
    etiquetas?: string[];
    historialEstados?: StateChange[];
    imagenes?: IncidentFile[]; // Ahora maneja cualquier archivo
    archivos?: IncidentFile[]; // Alias alternativo para mejor semántica
}
