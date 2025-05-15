import { Cell } from '@/models/Cell';
import { TeamService } from './teamService';
import { promises as fs } from 'fs';
import path from 'path';

const cellsFilePath = path.join(process.cwd(), 'data', 'cells.txt');

export class CellService {
    private teamService: TeamService;

    constructor() {
        this.teamService = new TeamService();
    }

    async getAllCells(): Promise<Cell[]> {
        try {
            const content = await fs.readFile(cellsFilePath, 'utf-8');
            return content ? JSON.parse(content) : [];
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                await fs.writeFile(cellsFilePath, '[]');
                return [];
            }
            throw error;
        }
    }

    async saveCell(cell: Cell): Promise<Cell | null> {
        // Verify team exists
        const team = await this.teamService.getTeamById(cell.teamId);
        if (!team) return null;

        const cells = await this.getAllCells();
        cell.id = crypto.randomUUID();
        cells.push(cell);
        await fs.writeFile(cellsFilePath, JSON.stringify(cells, null, 2));
        return cell;
    }

    async updateCell(id: string, cell: Cell): Promise<Cell | null> {
        // Verify team exists if teamId is being updated
        if (cell.teamId) {
            const team = await this.teamService.getTeamById(cell.teamId);
            if (!team) return null;
        }

        const cells = await this.getAllCells();
        const index = cells.findIndex(c => c.id === id);
        if (index === -1) return null;
        
        cells[index] = { ...cells[index], ...cell };
        await fs.writeFile(cellsFilePath, JSON.stringify(cells, null, 2));
        return cells[index];
    }

    async deleteCell(id: string): Promise<boolean> {
        const cells = await this.getAllCells();
        const filteredCells = cells.filter(c => c.id !== id);
        if (filteredCells.length === cells.length) return false;
        
        await fs.writeFile(cellsFilePath, JSON.stringify(filteredCells, null, 2));
        return true;
    }

    async getCellById(id: string): Promise<Cell | null> {
        const cells = await this.getAllCells();
        return cells.find(c => c.id === id) || null;
    }

    async getCellsByTeamId(teamId: string): Promise<Cell[]> {
        const cells = await this.getAllCells();
        return cells.filter(c => c.teamId === teamId);
    }
}
