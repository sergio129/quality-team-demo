import { Project } from '@/models/Project';
import { promises as fs } from 'fs';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), 'data', 'seguimiento.txt');

export class ProjectFileService {
    async getAllProjects(): Promise<Project[]> {
        try {
            const fileContent = await fs.readFile(FILE_PATH, 'utf-8');
            const projects = JSON.parse(fileContent);
            
            // Filtrar proyectos inválidos o incompletos
            return projects.filter((project: any) => {
                return project && 
                       project.idJira && 
                       project.proyecto && 
                       project.equipo &&
                       project.celula;
            });
        } catch (error) {
            console.error('Error reading projects:', error);
            return [];
        }
    }

    async saveProject(project: Project): Promise<boolean> {
        try {
            const projects = await this.getAllProjects();
            projects.push(project);
            await fs.writeFile(FILE_PATH, JSON.stringify(projects, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving project:', error);
            return false;
        }
    }

    async updateProject(idJira: string, project: Partial<Project>): Promise<boolean> {
        try {
            const projects = await this.getAllProjects();
            const index = projects.findIndex((p: Project) => p.idJira === idJira);
            if (index === -1) return false;
            
            projects[index] = { ...projects[index], ...project };
            await fs.writeFile(FILE_PATH, JSON.stringify(projects, null, 2));
            return true;
        } catch (error) {
            console.error(`Error updating project ${idJira}:`, error);
            return false;
        }
    }

    async deleteProject(idJira: string): Promise<boolean> {
        try {
            const projects = await this.getAllProjects();
            const filteredProjects = projects.filter((p: Project) => p.idJira !== idJira);
            if (filteredProjects.length === projects.length) return false;
            
            await fs.writeFile(FILE_PATH, JSON.stringify(filteredProjects, null, 2));
            return true;
        } catch (error) {
            console.error(`Error deleting project ${idJira}:`, error);
            return false;
        }
    }

    async getProjectById(idJira: string): Promise<Project | null> {
        try {
            const projects = await this.getAllProjects();
            return projects.find((p: Project) => p.idJira === idJira) || null;
        } catch (error) {
            console.error(`Error getting project ${idJira}:`, error);
            return null;
        }
    }
}
