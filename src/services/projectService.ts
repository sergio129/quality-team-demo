import fs from 'fs/promises';
import path from 'path';
import { Project } from '@/models/Project';

const FILE_PATH = path.join(process.cwd(), 'data', 'seguimiento.txt');

export const projectService = {
    async getAllProjects(): Promise<Project[]> {
        try {
            const fileContent = await fs.readFile(FILE_PATH, 'utf-8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading projects:', error);
            return [];
        }
    },

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
    },

    async updateProject(idJira: string, updatedProject: Project): Promise<boolean> {
        try {
            const projects = await this.getAllProjects();
            const index = projects.findIndex(p => p.idJira === idJira);
            if (index !== -1) {
                projects[index] = updatedProject;
                await fs.writeFile(FILE_PATH, JSON.stringify(projects, null, 2));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating project:', error);
            return false;
        }
    },

    async deleteProject(idJira: string): Promise<boolean> {
        try {
            const projects = await this.getAllProjects();
            const filteredProjects = projects.filter(p => p.idJira !== idJira);
            await fs.writeFile(FILE_PATH, JSON.stringify(filteredProjects, null, 2));
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    }
};
