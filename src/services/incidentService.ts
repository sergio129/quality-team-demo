import fs from 'fs';
import path from 'path';

const incidentsFile = path.join(process.cwd(), 'data', 'incidents.txt');

export interface IncidentStats {
    totalPorCliente: { [key: string]: number };
    totalPorPrioridad: {
        Alta: number;
        Media: number;
        Baja: number;
    };
    totalAbiertas: number;
}

function calculateDaysOpen(fechaCreacion: Date, fechaSolucion?: Date): number {
    const start = new Date(fechaCreacion);
    const end = fechaSolucion ? new Date(fechaSolucion) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const incidentService = {    async getAll() {
        if (!fs.existsSync(incidentsFile)) {
            await fs.promises.writeFile(incidentsFile, '[]');
            return [];
        }
        const content = await fs.promises.readFile(incidentsFile, 'utf-8');
        const incidents = JSON.parse(content || '[]');
        
        // Update days open for each incident
        return incidents.map((incident: any) => ({
            ...incident,
            fechaCreacion: new Date(incident.fechaCreacion),
            fechaSolucion: incident.fechaSolucion ? new Date(incident.fechaSolucion) : undefined,
            diasAbierto: calculateDaysOpen(incident.fechaCreacion, incident.fechaSolucion)
        }));
    },    async save(incident: any) {
        const incidents = await this.getAll();
        const newIncident = {
            ...incident,
            fechaCreacion: new Date(incident.fechaCreacion),
            fechaSolucion: incident.fechaSolucion ? new Date(incident.fechaSolucion) : undefined,
            diasAbierto: calculateDaysOpen(incident.fechaCreacion, incident.fechaSolucion)
        };
        incidents.push(newIncident);
        await fs.promises.writeFile(incidentsFile, JSON.stringify(incidents, null, 2));
        return newIncident;
    },

    async update(id: string, incident: any) {
        const incidents = await this.getAll();
        const index = incidents.findIndex((i: any) => i.id === id);
        if (index !== -1) {
            const updatedIncident = {
                ...incidents[index],
                ...incident,
                fechaCreacion: new Date(incident.fechaCreacion || incidents[index].fechaCreacion),
                fechaSolucion: incident.fechaSolucion ? new Date(incident.fechaSolucion) : undefined,
                diasAbierto: calculateDaysOpen(
                    incident.fechaCreacion || incidents[index].fechaCreacion,
                    incident.fechaSolucion
                )
            };
            incidents[index] = updatedIncident;
            await fs.promises.writeFile(incidentsFile, JSON.stringify(incidents, null, 2));
            return updatedIncident;
        }
        return null;
    },

    async delete(id: string) {
        const incidents = await this.getAll();
        const filteredIncidents = incidents.filter((i: any) => i.id !== id);
        await fs.promises.writeFile(incidentsFile, JSON.stringify(filteredIncidents, null, 2));
    },    async getStats(): Promise<IncidentStats> {
        const incidents = await this.getAll();
        const stats: IncidentStats = {
            totalPorCliente: {},
            totalPorPrioridad: {
                Alta: 0,
                Media: 0,
                Baja: 0
            },
            totalAbiertas: 0
        };

        incidents.forEach((incident: any) => {
            // Contar por cliente
            if (!stats.totalPorCliente[incident.cliente]) {
                stats.totalPorCliente[incident.cliente] = 0;
            }
            stats.totalPorCliente[incident.cliente]++;

            // Contar por prioridad y estado
            if (!incident.fechaSolucion && incident.estado !== 'Resuelto') {
                stats.totalPorPrioridad[incident.prioridad]++;
                stats.totalAbiertas++;
            }
        });

        return stats;
    }
};
