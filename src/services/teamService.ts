import { Team } from '@/models/Team';
import { TeamFileService } from './file/teamFileService';
import { TeamPrismaService } from './prisma/teamPrismaService';
import { migrationConfig } from '@/config/migration';

export class TeamService {
    private fileService: TeamFileService;
    private prismaService: TeamPrismaService;
    private usePostgres: boolean;

    constructor() {
        this.fileService = new TeamFileService();
        this.prismaService = new TeamPrismaService();
        this.usePostgres = migrationConfig.shouldUsePostgresFor('teams');
        
        // Log qué base de datos estamos usando si el logging está habilitado
        if (migrationConfig.logging.enabled) {
            console.log(`[TeamService] Using ${this.usePostgres ? 'PostgreSQL' : 'File'} storage`);
        }
    }

    async getAllTeams(): Promise<Team[]> {
        try {
            const result = this.usePostgres 
                ? await this.prismaService.getAllTeams() 
                : await this.fileService.getAllTeams();
                
            return result;
        } catch (error) {
            console.error(`[TeamService] Error in getAllTeams:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[TeamService] Falling back to file storage');
                return await this.fileService.getAllTeams();
            }
            throw error;
        }
    }
    
    async saveTeam(team: Team): Promise<Team> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.saveTeam(team)
                : await this.fileService.saveTeam(team);
                
            return result;
        } catch (error) {
            console.error(`[TeamService] Error in saveTeam:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[TeamService] Falling back to file storage');
                return await this.fileService.saveTeam(team);
            }
            throw error;
        }    }async updateTeam(id: string, team: Partial<Team>): Promise<Team | null> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.updateTeam(id, team)
                : await this.fileService.updateTeam(id, team);
                
            return result;
        } catch (error) {
            console.error(`[TeamService] Error in updateTeam:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[TeamService] Falling back to file storage');
                return await this.fileService.updateTeam(id, team);
            }
            throw error;
        }
    }

    async deleteTeam(id: string): Promise<boolean> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.deleteTeam(id)
                : await this.fileService.deleteTeam(id);
                
            return result;
        } catch (error) {
            console.error(`[TeamService] Error in deleteTeam:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[TeamService] Falling back to file storage');
                return await this.fileService.deleteTeam(id);
            }
            throw error;
        }
    }

    async getTeamById(id: string): Promise<Team | null> {
        try {
            const result = this.usePostgres
                ? await this.prismaService.getTeamById(id)
                : await this.fileService.getTeamById(id);
                
            return result;
        } catch (error) {
            console.error(`[TeamService] Error in getTeamById:`, error);
            // En caso de error con PostgreSQL, intentar con archivos
            if (this.usePostgres && migrationConfig.fallback.enabled) {
                console.log('[TeamService] Falling back to file storage');
                return await this.fileService.getTeamById(id);
            }
            throw error;
        }
    }
}
