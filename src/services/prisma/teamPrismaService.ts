import { Team } from '../../models/Team';
import { prisma } from '../../lib/prisma';

export class TeamPrismaService {
    async getAllTeams(): Promise<Team[]> {
        try {
            const teams = await prisma.team.findMany({
                include: {
                    members: {
                        include: {
                            analyst: true
                        }
                    }
                }
            });
            
            return teams.map(team => ({
                id: team.id,
                name: team.name,
                description: team.description || '',
                members: team.members.map(member => member.analystId)
            }));
        } catch (error) {
            console.error('Error fetching teams from database:', error);
            throw error;
        }
    }

    async saveTeam(team: Team): Promise<Team> {
        try {
            // Crear el equipo en la base de datos
            const newTeam = await prisma.team.create({
                data: {
                    name: team.name,
                    description: team.description,
                    // Si hay miembros, crear las relaciones
                    ...(team.members && team.members.length > 0 && {
                        members: {
                            create: team.members.map(analystId => ({
                                analyst: { connect: { id: analystId } }
                            }))
                        }
                    })
                },
                include: {
                    members: true
                }
            });

            return {
                id: newTeam.id,
                name: newTeam.name,
                description: newTeam.description || '',
                members: newTeam.members.map(member => member.analystId)
            };
        } catch (error) {
            console.error('Error saving team to database:', error);
            throw error;
        }
    }

    async updateTeam(id: string, team: Partial<Team>): Promise<Team | null> {
        try {
            // Verificar que el equipo existe
            const existingTeam = await prisma.team.findUnique({
                where: { id },
                include: {
                    members: true
                }
            });

            if (!existingTeam) {
                return null;
            }

            // Preparar los datos básicos para actualizar
            const updateData: any = {};
            if (team.name) updateData.name = team.name;
            if (team.description !== undefined) updateData.description = team.description;

            // Actualizar el equipo
            const updatedTeam = await prisma.team.update({
                where: { id },
                data: updateData,
                include: {
                    members: true
                }
            });

            // Si se proporcionaron miembros, actualizar las relaciones
            if (team.members) {
                // Eliminar todas las relaciones actuales
                await prisma.teamAnalyst.deleteMany({
                    where: { teamId: id }
                });

                // Crear nuevas relaciones
                await Promise.all(team.members.map(analystId => 
                    prisma.teamAnalyst.create({
                        data: {
                            team: { connect: { id } },
                            analyst: { connect: { id: analystId } }
                        }
                    })
                ));
            }

            // Obtener el equipo actualizado con sus miembros
            const refreshedTeam = await prisma.team.findUnique({
                where: { id },
                include: {
                    members: true
                }
            });

            if (!refreshedTeam) {
                return null;
            }

            return {
                id: refreshedTeam.id,
                name: refreshedTeam.name,
                description: refreshedTeam.description || '',
                members: refreshedTeam.members.map(member => member.analystId)
            };
        } catch (error) {
            console.error('Error updating team in database:', error);
            return null;
        }
    }

    async deleteTeam(id: string): Promise<boolean> {
        try {
            // Verificar que el equipo existe
            const existingTeam = await prisma.team.findUnique({
                where: { id }
            });

            if (!existingTeam) {
                return false;
            }

            // Eliminar el equipo
            await prisma.team.delete({
                where: { id }
            });

            return true;
        } catch (error) {
            console.error('Error deleting team from database:', error);
            return false;
        }
    }

    async getTeamById(id: string): Promise<Team | null> {
        try {
            const team = await prisma.team.findUnique({
                where: { id },
                include: {
                    members: true
                }
            });

            if (!team) {
                return null;
            }

            return {
                id: team.id,
                name: team.name,
                description: team.description || '',
                members: team.members.map(member => member.analystId)
            };
        } catch (error) {
            console.error('Error getting team by ID from database:', error);
            return null;
        }
    }
}
