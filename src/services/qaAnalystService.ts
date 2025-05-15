import { QAAnalyst } from '@/models/QAAnalyst';
import { CellService } from './cellService';
import { promises as fs } from 'fs';
import path from 'path';

const analystsFilePath = path.join(process.cwd(), 'data', 'analysts.txt');

export class QAAnalystService {
    private cellService: CellService;

    constructor() {
        this.cellService = new CellService();
    }

    async getAllAnalysts(): Promise<QAAnalyst[]> {
        try {
            const content = await fs.readFile(analystsFilePath, 'utf-8');
            return content ? JSON.parse(content) : [];
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                await fs.writeFile(analystsFilePath, '[]');
                return [];
            }
            throw error;
        }
    }

    async saveAnalyst(analyst: QAAnalyst): Promise<QAAnalyst | null> {
        // Verify cell exists
        const cell = await this.cellService.getCellById(analyst.cellId);
        if (!cell) return null;

        const analysts = await this.getAllAnalysts();
        analyst.id = crypto.randomUUID();
        analysts.push(analyst);
        await fs.writeFile(analystsFilePath, JSON.stringify(analysts, null, 2));
        return analyst;
    }

    async updateAnalyst(id: string, analyst: QAAnalyst): Promise<QAAnalyst | null> {
        // Verify cell exists if cellId is being updated
        if (analyst.cellId) {
            const cell = await this.cellService.getCellById(analyst.cellId);
            if (!cell) return null;
        }

        const analysts = await this.getAllAnalysts();
        const index = analysts.findIndex(a => a.id === id);
        if (index === -1) return null;
        
        analysts[index] = { ...analysts[index], ...analyst };
        await fs.writeFile(analystsFilePath, JSON.stringify(analysts, null, 2));
        return analysts[index];
    }

    async deleteAnalyst(id: string): Promise<boolean> {
        const analysts = await this.getAllAnalysts();
        const filteredAnalysts = analysts.filter(a => a.id !== id);
        if (filteredAnalysts.length === analysts.length) return false;
        
        await fs.writeFile(analystsFilePath, JSON.stringify(filteredAnalysts, null, 2));
        return true;
    }

    async getAnalystById(id: string): Promise<QAAnalyst | null> {
        const analysts = await this.getAllAnalysts();
        return analysts.find(a => a.id === id) || null;
    }

    async getAnalystsByCellId(cellId: string): Promise<QAAnalyst[]> {
        const analysts = await this.getAllAnalysts();
        return analysts.filter(a => a.cellId === cellId);
    }
}
