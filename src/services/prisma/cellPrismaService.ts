import { Cell } from '@/models/Cell';
import { prisma } from '@/lib/prisma';

export class CellPrismaService {
    async getAllCells(): Promise<Cell[]> {
        try {
            const cells = await prisma.cell.findMany();
            
            return cells.map(cell => ({
                id: cell.id,
                name: cell.name,
                description: cell.description || '',
                teamId: cell.teamId
            }));
        } catch (error) {
            console.error('Error fetching cells from database:', error);
            throw error;
        }
    }

    async saveCell(cell: Cell): Promise<Cell | null> {
        try {
            // Verificar que el equipo existe
            const team = await prisma.team.findUnique({
                where: { id: cell.teamId }
            });

            if (!team) {
                return null;
            }

            const newCell = await prisma.cell.create({
                data: {
                    name: cell.name,
                    description: cell.description,
                    team: { connect: { id: cell.teamId } }
                }
            });

            return {
                id: newCell.id,
                name: newCell.name,
                description: newCell.description || '',
                teamId: newCell.teamId
            };
        } catch (error) {
            console.error('Error saving cell to database:', error);
            return null;
        }
    }

    async updateCell(id: string, cell: Partial<Cell>): Promise<Cell | null> {
        try {
            // Verificar que la célula existe
            const existingCell = await prisma.cell.findUnique({
                where: { id }
            });

            if (!existingCell) {
                return null;
            }

            // Si se está actualizando el equipo, verificar que existe
            if (cell.teamId) {
                const team = await prisma.team.findUnique({
                    where: { id: cell.teamId }
                });

                if (!team) {
                    return null;
                }
            }

            const updatedCell = await prisma.cell.update({
                where: { id },
                data: {
                    name: cell.name,
                    description: cell.description,
                    ...(cell.teamId && { team: { connect: { id: cell.teamId } } })
                }
            });

            return {
                id: updatedCell.id,
                name: updatedCell.name,
                description: updatedCell.description || '',
                teamId: updatedCell.teamId
            };
        } catch (error) {
            console.error('Error updating cell in database:', error);
            return null;
        }
    }

    async deleteCell(id: string): Promise<boolean> {
        try {
            // Verificar que la célula existe
            const existingCell = await prisma.cell.findUnique({
                where: { id }
            });

            if (!existingCell) {
                return false;
            }

            await prisma.cell.delete({
                where: { id }
            });

            return true;
        } catch (error) {
            console.error('Error deleting cell from database:', error);
            return false;
        }
    }

    async getCellById(id: string): Promise<Cell | null> {
        try {
            const cell = await prisma.cell.findUnique({
                where: { id }
            });

            if (!cell) {
                return null;
            }

            return {
                id: cell.id,
                name: cell.name,
                description: cell.description || '',
                teamId: cell.teamId
            };
        } catch (error) {
            console.error('Error getting cell by ID from database:', error);
            return null;
        }
    }

    async getCellsByTeamId(teamId: string): Promise<Cell[]> {
        try {
            const cells = await prisma.cell.findMany({
                where: { teamId }
            });

            return cells.map(cell => ({
                id: cell.id,
                name: cell.name,
                description: cell.description || '',
                teamId: cell.teamId
            }));
        } catch (error) {
            console.error('Error getting cells by team ID from database:', error);
            return [];
        }
    }
}
