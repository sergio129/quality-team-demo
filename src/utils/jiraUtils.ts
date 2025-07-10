export const getJiraUrl = (idJira: string | null | undefined): string | undefined => {
    // Si el ID está vacío o es inválido, retornar undefined
    if (!idJira || idJira === 'undefined' || idJira === 'null') return undefined;
    
    // El formato base de la URL de Jira
    return `https://konecta-group.atlassian.net/browse/${idJira}`;
};
