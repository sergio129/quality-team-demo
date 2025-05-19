export interface Team {
    id: string;
    name: string;
    description?: string;
    members?: string[]; // IDs de los analistas asignados al equipo
}
