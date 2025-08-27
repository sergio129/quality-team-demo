// Utilidades para manejar colores de equipos
export const TEAM_COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#A855F7', // Violet
    '#DC2626', // Red-600
    '#059669', // Emerald
    '#D97706', // Amber
    '#7C3AED', // Purple-600
    

];

export const getTeamColor = (teamName: string, teams: any[]): string => {
    if (!teamName || !teams) return TEAM_COLORS[0];

    const team = teams.find(t => t.name === teamName);
    if (team && team.color) {
        return team.color;
    }

    // Si no tiene color asignado, usar uno basado en el nombre del equipo
    const index = teamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % TEAM_COLORS.length;
    return TEAM_COLORS[index];
};

export const getTeamColorStyles = (teamName: string, teams: any[]) => {
    const color = getTeamColor(teamName, teams);
    return {
        backgroundColor: `${color}20`, // Color de fondo con 20% de opacidad
        color: color,
        border: `1px solid ${color}40`, // Borde con 40% de opacidad
    };
};

export const getTeamTextStyles = (teamName: string, teams: any[]) => {
    const color = getTeamColor(teamName, teams);
    return {
        color: color,
        fontWeight: '500',
    };
};
