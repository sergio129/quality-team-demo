export interface StateChange {
    estado: string;
    fecha: Date;
    comentario?: string;
}

export type BugType = 'UI' | 'Funcional' | 'Performance' | 'Seguridad' | 'Base de Datos' | 'Integración' | 'Otro';
export type AreaAfectada = 'Frontend' | 'Backend' | 'Base de Datos' | 'API' | 'Infraestructura' | 'Integración' | 'Otro';

export interface Incident {
    id: string;
    celula: string;
    estado: string;
    prioridad: string;
    descripcion: string;
    fechaCreacion: Date;
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
}
