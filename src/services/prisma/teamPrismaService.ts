import { Team } from '../../models/Team';
import { prisma } from '../../lib/prisma';

export class TeamPrismaService {
    async getAllTeams(): Promise<Team[]> {
        try {
            const teams = await prisma.team.findMany({
                include: {
                    analysts: {
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
                members: team.analysts.map((relation: { analystId: string }) => relation.analystId)
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
                        analysts: {
                            create: team.members.map(analystId => ({
                                analyst: { connect: { id: analystId } }
                            }))
                        }
                    })
                },
                include: {
                    analysts: {
                        include: {
                            analyst: true
                        }
                    }
                }
            });

            return {
                id: newTeam.id,
                name: newTeam.name,
                description: newTeam.description || '',
                members: newTeam.analysts.map((relation: { analystId: string }) => relation.analystId)
            };
        } catch (error) {
            console.error('Error saving team to database:', error);
            throw error;
        }
    }

    async updateTeam(id: string, teamData: Partial<Team>): Promise<Team | null> {
        try {
            // Primero necesitamos verificar si el equipo existe
            const existingTeam = await prisma.team.findUnique({
                where: { id },
                include: {
                    analysts: true
                }
            });

            if (!existingTeam) {
                return null;
            }

            // Actualizar el equipo básico
            let updatedTeam = await prisma.team.update({
                where: { id },
                data: {
                    name: teamData.name !== undefined ? teamData.name : undefined,
                    description: teamData.description !== undefined ? teamData.description : undefined,
                },
                include: {
                    analysts: {
                        include: {
                            analyst: true
                        }
                    }
                }
            });

            // Si se proporcionan miembros, actualizar las relaciones
            if (teamData.members !== undefined) {
                // Eliminar todas las relaciones existentes
                await prisma.teamAnalyst.deleteMany({
                    where: { teamId: id }
                });

                // Crear nuevas relaciones si hay miembros
                if (teamData.members && teamData.members.length > 0) {
                    for (const analystId of teamData.members) {
                        await prisma.teamAnalyst.create({
                            data: {
                                team: { connect: { id } },
                                analyst: { connect: { id: analystId } }
                            }
                        });
                    }
                }

                // Volver a cargar el equipo para obtener las relaciones actualizadas
                updatedTeam = await prisma.team.findUnique({
                    where: { id },
                    include: {
                        analysts: {
                            include: {
                                analyst: true
                            }
                        }
                    }
                }) as any;
            }

            return {
                id: updatedTeam.id,
                name: updatedTeam.name,
                description: updatedTeam.description || '',
                members: updatedTeam.analysts.map((relation: { analystId: string }) => relation.analystId)
            };
        } catch (error) {
            console.error(`Error updating team ${id}:`, error);
            throw error;
        }
    }

    async deleteTeam(id: string): Promise<boolean> {
        try {
            // Verificar si el equipo existe
            const team = await prisma.team.findUnique({
                where: { id }
            });

            if (!team) {
                return false;
            }

            // Eliminar el equipo (las relaciones se eliminarán automáticamente por las restricciones de clave foránea)
            await prisma.team.delete({
                where: { id }
            });

            return true;
        } catch (error) {
            console.error(`Error deleting team ${id}:`, error);
            throw error;
        }
    }

    async getTeamById(id: string): Promise<Team | null> {
        try {
            const team = await prisma.team.findUnique({
                where: { id },
                include: {
                    analysts: {
                        include: {
                            analyst: true
                        }
                    }
                }
            });

            if (!team) {
                return null;
            }

            return {
                id: team.id,
                name: team.name,
                description: team.description || '',
                members: team.analysts.map((relation: { analystId: string }) => relation.analystId)
            };
        } catch (error) {
            console.error(`Error fetching team ${id}:`, error);
            throw error;
        }
    }
}
