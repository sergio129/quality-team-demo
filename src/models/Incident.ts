export interface Incident {
    id: string;
    celula: string;
    estado: 'Abierto' | 'Resuelto' | 'En Progreso';
    prioridad: 'Alta' | 'Media' | 'Baja';
    descripcion: string;
    fechaCreacion: Date;
    informadoPor: string;
    asignadoA: string;
    fechaSolucion?: Date;
    diasAbierto: number;
    esErroneo: boolean;
    aplica: boolean;
    cliente: string;
}
