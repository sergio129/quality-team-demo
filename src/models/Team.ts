export interface Team {
    id: string;
    name: string;
    description?: string;
    color?: string; // Color característico del equipo (hexadecimal)
    members?: string[]; // IDs de los analistas asignados al equipo
}
