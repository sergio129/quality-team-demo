import fs from 'fs';
import path from 'path';
import { Incident } from '../../models/Incident';

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

export class IncidentFileService {
    async getAll(): Promise<Incident[]> {
        if (!fs.existsSync(incidentsFile)) {
            await fs.promises.writeFile(incidentsFile, '[]');
            return [];
        }
        const content = await fs.promises.readFile(incidentsFile, 'utf-8');
        const incidents = JSON.parse(content || '[]');
        
        // Update days open for each incident
        return incidents.map((incident: Incident) => ({
            ...incident,
            fechaCreacion: new Date(incident.fechaCreacion),
            fechaReporte: new Date(incident.fechaReporte || incident.fechaCreacion),
            fechaSolucion: incident.fechaSolucion ? new Date(incident.fechaSolucion) : undefined,
            diasAbierto: calculateDaysOpen(incident.fechaCreacion, incident.fechaSolucion)
        }));
    }

    async save(incident: Partial<Incident>): Promise<Incident> {
        const incidents = await this.getAll();
        // Generate a unique ID (format: INC-YYYYMMDD-XXX)
        const today = new Date();
        const dateStr = today.toISOString().slice(0,10).replace(/-/g,'');
        const existingIds = incidents
            .map((i: Incident) => i.id || '')
            .filter((id: string) => id.startsWith(`INC-${dateStr}`))
            .map((id: string) => parseInt(id.split('-')[2] || '0'));
        const sequence = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
        const newId = `INC-${dateStr}-${String(sequence).padStart(3, '0')}`;
        
        const newIncident = {
            ...incident,
            id: newId,
            fechaCreacion: new Date(incident.fechaCreacion || new Date()),
            fechaReporte: new Date(incident.fechaReporte || new Date()),
            fechaSolucion: incident.fechaSolucion ? new Date(incident.fechaSolucion) : undefined,
            diasAbierto: calculateDaysOpen(
                incident.fechaCreacion || new Date(), 
                incident.fechaSolucion
            )
        } as Incident;
        
        incidents.push(newIncident);
        await fs.promises.writeFile(incidentsFile, JSON.stringify(incidents, null, 2));
        return newIncident;
    }

    async update(id: string, incident: Partial<Incident>): Promise<Incident | null> {
        const incidents = await this.getAll();
        const index = incidents.findIndex((i: Incident) => i.id === id);
        if (index !== -1) {
            const updatedIncident = {
                ...incidents[index],
                ...incident,
                fechaCreacion: new Date(incident.fechaCreacion || incidents[index].fechaCreacion),
                fechaReporte: new Date(incident.fechaReporte || incidents[index].fechaReporte),
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
    }

    async delete(id: string): Promise<void> {
        const incidents = await this.getAll();
        const filteredIncidents = incidents.filter((i: Incident) => i.id !== id);
        await fs.promises.writeFile(incidentsFile, JSON.stringify(filteredIncidents, null, 2));
    }
    
    async getStats(): Promise<IncidentStats> {
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

        incidents.forEach((incident: Incident) => {
            // Contar por cliente
            if (!stats.totalPorCliente[incident.cliente]) {
                stats.totalPorCliente[incident.cliente] = 0;
            }
            stats.totalPorCliente[incident.cliente]++;

            // Contar por prioridad y estado
            if (!incident.fechaSolucion && incident.estado !== 'Resuelto') {
                if (incident.prioridad === 'Alta' || incident.prioridad === 'Media' || incident.prioridad === 'Baja') {
                    stats.totalPorPrioridad[incident.prioridad]++;
                }
                stats.totalAbiertas++;
            }
        });

        return stats;
    }
}
