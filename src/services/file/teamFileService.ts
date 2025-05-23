import { Team } from '@/models/Team';
import { promises as fs } from 'fs';
import path from 'path';

const teamsFilePath = path.join(process.cwd(), 'data', 'teams.txt');

export class TeamFileService {
    async getAllTeams(): Promise<Team[]> {
        try {
            const content = await fs.readFile(teamsFilePath, 'utf-8');
            return content ? JSON.parse(content) : [];
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                await fs.writeFile(teamsFilePath, '[]');
                return [];
            }
            throw error;
        }
    }

    async saveTeam(team: Team): Promise<Team> {
        const teams = await this.getAllTeams();
        team.id = crypto.randomUUID();
        teams.push(team);
        await fs.writeFile(teamsFilePath, JSON.stringify(teams, null, 2));
        return team;
    }

    async updateTeam(id: string, team: Partial<Team>): Promise<Team | null> {
        const teams = await this.getAllTeams();
        const index = teams.findIndex(t => t.id === id);
        if (index === -1) return null;
        
        // Mantener miembros si existen pero no están en la actualización
        if (teams[index].members && !team.members) {
            team.members = teams[index].members;
        }
        
        teams[index] = { ...teams[index], ...team };
        await fs.writeFile(teamsFilePath, JSON.stringify(teams, null, 2));
        return teams[index];
    }

    async deleteTeam(id: string): Promise<boolean> {
        const teams = await this.getAllTeams();
        const filteredTeams = teams.filter(t => t.id !== id);
        if (filteredTeams.length === teams.length) return false;
        
        await fs.writeFile(teamsFilePath, JSON.stringify(filteredTeams, null, 2));
        return true;
    }    async getTeamById(id: string): Promise<Team | null> {
        const teams = await this.getAllTeams();
        return teams.find(t => t.id === id) || null;
    }
}
