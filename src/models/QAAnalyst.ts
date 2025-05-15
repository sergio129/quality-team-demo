export interface QAAnalyst {
    id: string;
    name: string;
    email: string;
    cellIds: string[];  // Ahora es un array de IDs de células
    role: string;
}
