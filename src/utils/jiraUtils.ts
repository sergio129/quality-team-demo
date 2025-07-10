export const getJiraUrl = (idJira: string | null | undefined) => {
    // Si el ID está vacío o es inválido, retornar null
    if (!idJira || idJira === 'undefined' || idJira === 'null') return null;
    
    // El formato base de la URL de Jira
    return `https://konecta-group.atlassian.net/browse/${idJira}`;
};
