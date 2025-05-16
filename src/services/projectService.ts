const fs = require('fs').promises;
const path = require('path');
import { Project } from '@/models/Project';

const FILE_PATH = path.join(process.cwd(), 'data', 'seguimiento.txt');

export const projectService = {    async getAllProjects(): Promise<Project[]> {
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
    },    async updateProject(idJira: string, updatedProject: Project): Promise<boolean> {
        try {
            if (!idJira) {
                console.error('Error updating project: No idJira provided');
                return false;
            }
            
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
    },    async deleteProject(idJira: string): Promise<boolean> {
        try {
            if (!idJira) {
                console.error('Error deleting project: No idJira provided');
                return false;
            }
            
            const projects = await this.getAllProjects();
            const filteredProjects = projects.filter(p => p.idJira !== idJira);
            await fs.writeFile(FILE_PATH, JSON.stringify(filteredProjects, null, 2));
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }    },
    
    async updateProjectStatus(projectId: string, newStatus: string): Promise<boolean> {
        try {
            if (!projectId) {
                console.error('Error updating project status: No project ID provided');
                return false;
            }
            
            const projects = await this.getAllProjects();
            // Buscar por id o idJira
            const index = projects.findIndex(p => 
                (p.id && p.id === projectId) || p.idJira === projectId
            );
            
            if (index !== -1) {
                // Solo actualizar el campo estado y estadoCalculado
                projects[index].estado = newStatus;
                projects[index].estadoCalculado = newStatus;
                
                // Si el estado es "Certificado" y no tiene fecha de certificación, establecerla
                if (newStatus === 'Certificado' && !projects[index].fechaCertificacion) {
                    projects[index].fechaCertificacion = new Date().toISOString();
                }
                
                await fs.writeFile(FILE_PATH, JSON.stringify(projects, null, 2));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating project status:', error);
            return false;
        }
    }
};
