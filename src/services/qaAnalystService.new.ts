import { QAAnalyst, QARole, Skill } from '@/models/QAAnalyst';
import { prisma } from '@/lib/prisma';

export class QAAnalystService {
  // Helper method to ensure role is one of the valid QARole types
  private mapDatabaseRoleToQARole(role: string): QARole {
    switch(role) {
      case 'QA Analyst':
      case 'QA Senior':
      case 'QA Leader':
        return role as QARole;
      default:
        // Default role if the database has an unexpected value
        return 'QA Analyst';
    }
  }

  async getAllAnalysts(): Promise<QAAnalyst[]> {
    try {
      const dbAnalysts = await prisma.qAAnalyst.findMany({
        include: {
          skills: true,
          certifications: true,
          specialties: true,
          cells: {
            include: {
              cell: true
            }
          }
        }
      });
      
      // Transformar los datos del formato de la base de datos al formato de la aplicación
      return dbAnalysts.map(dbAnalyst => {
        return {
          id: dbAnalyst.id,
          name: dbAnalyst.name,
          email: dbAnalyst.email,
          role: this.mapDatabaseRoleToQARole(dbAnalyst.role),
          color: dbAnalyst.color || undefined,
          availability: dbAnalyst.availability || 100,
          skills: dbAnalyst.skills.map(skill => ({
            name: skill.name,
            level: skill.level as 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto'
          })),
          certifications: dbAnalyst.certifications.map(cert => ({
            name: cert.name,
            issuer: cert.issuer,
            date: cert.date.toISOString().split('T')[0]
          })),
          specialties: dbAnalyst.specialties.map(spec => spec.name),
          cellIds: dbAnalyst.cells.map(cell => cell.cellId)
        };
      });
    } catch (error) {
      console.error('Error fetching analysts from database:', error);
      throw error;
    }
  }
  
  async saveAnalyst(analyst: QAAnalyst): Promise<QAAnalyst | null> {
    try {
      // Verificar que todas las células existen
      if (analyst.cellIds && analyst.cellIds.length > 0) {
        const cells = await prisma.cell.findMany({
          where: {
            id: {
              in: analyst.cellIds
            }
          }
        });
        
        if (cells.length !== analyst.cellIds.length) {
          throw new Error('Some cell IDs do not exist');
        }
      }
      
      const createdAnalyst = await prisma.qAAnalyst.create({
        data: {
          name: analyst.name,
          email: analyst.email,
          role: analyst.role || 'QA Analyst', // Cambiado el valor por defecto de 'Junior' a 'QA Analyst'
          color: analyst.color,
          availability: analyst.availability || 100,
          skills: {
            create: (analyst.skills || []).map(skillItem => ({
              name: typeof skillItem === 'string' ? skillItem : skillItem.name,
              level: typeof skillItem === 'string' ? 'Intermedio' : skillItem.level
            }))
          },
          certifications: {
            create: (analyst.certifications || []).map(cert => ({
              name: cert.name,
              issuer: cert.issuer || 'Desconocido',
              date: cert.date ? new Date(cert.date) : new Date()
            }))
          },
          specialties: {
            create: (analyst.specialties || []).map(spec => ({
              name: spec
            }))
          },
          cells: {
            create: analyst.cellIds.map(cellId => ({
              cell: {
                connect: { id: cellId }
              }
            }))
          }
        },
        include: {
          skills: true,
          certifications: true,
          specialties: true,
          cells: true
        }
      });
      
      // Transformar al formato de la aplicación
      return {
        id: createdAnalyst.id,
        name: createdAnalyst.name,
        email: createdAnalyst.email,
        role: this.mapDatabaseRoleToQARole(createdAnalyst.role),
        color: createdAnalyst.color || undefined,
        availability: createdAnalyst.availability || 100,
        skills: createdAnalyst.skills.map(skill => ({
          name: skill.name,
          level: skill.level as 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto'
        })),
        certifications: createdAnalyst.certifications.map(cert => ({
          name: cert.name,
          issuer: cert.issuer,
          date: cert.date.toISOString().split('T')[0]
        })),
        specialties: createdAnalyst.specialties.map(spec => spec.name),
        cellIds: createdAnalyst.cells.map(cell => cell.cellId)
      };
    } catch (error) {
      console.error('Error saving analyst to database:', error);
      return null;
    }
  }
  
  async updateAnalyst(id: string, analyst: Partial<QAAnalyst>): Promise<QAAnalyst | null> {
    try {
      // Verificar que el analista existe
      const existingAnalyst = await prisma.qAAnalyst.findUnique({
        where: { id },
        include: {
          skills: true,
          certifications: true,
          specialties: true,
          cells: true
        }
      });
      
      if (!existingAnalyst) {
        return null;
      }
      
      // Preparar los datos básicos para actualizar
      const updateData: any = {};
      if (analyst.name) updateData.name = analyst.name;
      if (analyst.email) updateData.email = analyst.email;
      if (analyst.role) updateData.role = analyst.role;
      if (analyst.color !== undefined) updateData.color = analyst.color;
      if (analyst.availability !== undefined) updateData.availability = analyst.availability;
      
      // Actualizar el analista
      const updatedAnalyst = await prisma.qAAnalyst.update({
        where: { id },
        data: updateData,
        include: {
          skills: true,
          certifications: true,
          specialties: true,
          cells: true
        }
      });
      
      // Actualizar skills si se proporcionaron
      if (analyst.skills) {
        // Eliminar skills existentes
        await prisma.skill.deleteMany({
          where: { analystId: id }
        });
        
        // Crear nuevas skills
        await Promise.all(analyst.skills.map(skillItem => 
          prisma.skill.create({
            data: {
              name: typeof skillItem === 'string' ? skillItem : skillItem.name,
              level: typeof skillItem === 'string' ? 'Intermedio' : skillItem.level,
              analyst: { connect: { id } }
            }
          })
        ));
      }
      
      // Actualizar certifications si se proporcionaron
      if (analyst.certifications) {
        // Eliminar certifications existentes
        await prisma.certification.deleteMany({
          where: { analystId: id }
        });
        
        // Crear nuevas certifications
        await Promise.all(analyst.certifications.map(cert => 
          prisma.certification.create({
            data: {
              name: cert.name,
              issuer: cert.issuer || 'Desconocido',
              date: cert.date ? new Date(cert.date) : new Date(),
              analyst: { connect: { id } }
            }
          })
        ));
      }
      
      // Actualizar specialties si se proporcionaron
      if (analyst.specialties) {
        // Eliminar specialties existentes
        await prisma.specialty.deleteMany({
          where: { analystId: id }
        });
        
        // Crear nuevas specialties
        await Promise.all(analyst.specialties.map(spec => 
          prisma.specialty.create({
            data: {
              name: spec,
              analysts: { connect: { id } }
            }
          })
        ));
      }
      
      // Actualizar cells si se proporcionaron
      if (analyst.cellIds) {
        // Eliminar relaciones existentes
        await prisma.analystCell.deleteMany({
          where: { analystId: id }
        });
        
        // Crear nuevas relaciones
        await Promise.all(analyst.cellIds.map(cellId => 
          prisma.analystCell.create({
            data: {
              analyst: { connect: { id } },
              cell: { connect: { id: cellId } }
            }
          })
        ));
      }
      
      // Recargar el analista con todos los datos actualizados
      const refreshedAnalyst = await prisma.qAAnalyst.findUnique({
        where: { id },
        include: {
          skills: true,
          certifications: true,
          specialties: true,
          cells: true
        }
      });
      
      if (!refreshedAnalyst) {
        return null;
      }
      
      // Transformar al formato de la aplicación
      return {
        id: refreshedAnalyst.id,
        name: refreshedAnalyst.name,
        email: refreshedAnalyst.email,
        role: this.mapDatabaseRoleToQARole(refreshedAnalyst.role),
        color: refreshedAnalyst.color || undefined,
        availability: refreshedAnalyst.availability || 100,
        skills: refreshedAnalyst.skills.map(skill => ({
          name: skill.name,
          level: skill.level as 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto'
        })),
        certifications: refreshedAnalyst.certifications.map(cert => ({
          name: cert.name,
          issuer: cert.issuer,
          date: cert.date.toISOString().split('T')[0]
        })),
        specialties: refreshedAnalyst.specialties.map(spec => spec.name),
        cellIds: refreshedAnalyst.cells.map(cell => cell.cellId)
      };
    } catch (error) {
      console.error('Error updating analyst in database:', error);
      return null;
    }
  }
  
  async deleteAnalyst(id: string): Promise<boolean> {
    try {
      await prisma.qAAnalyst.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting analyst from database:', error);
      return false;
    }
  }
  
  async getAnalystById(id: string): Promise<QAAnalyst | null> {
    try {
      const analyst = await prisma.qAAnalyst.findUnique({
        where: { id },
        include: {
          skills: true,
          certifications: true,
          specialties: true,
          cells: true
        }
      });
      
      if (!analyst) {
        return null;
      }
      
      // Transformar al formato de la aplicación
      return {
        id: analyst.id,
        name: analyst.name,
        email: analyst.email,
        role: this.mapDatabaseRoleToQARole(analyst.role),
        color: analyst.color || undefined,
        availability: analyst.availability || 100,
        skills: analyst.skills.map(skill => ({
          name: skill.name,
          level: skill.level as 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto'
        })),
        certifications: analyst.certifications.map(cert => ({
          name: cert.name,
          issuer: cert.issuer,
          date: cert.date.toISOString().split('T')[0]
        })),
        specialties: analyst.specialties.map(spec => spec.name),
        cellIds: analyst.cells.map(cell => cell.cellId)
      };
    } catch (error) {
      console.error('Error getting analyst by ID from database:', error);
      return null;
    }
  }
  
  async getAnalystsByCellId(cellId: string): Promise<QAAnalyst[]> {
    try {
      const analystCells = await prisma.analystCell.findMany({
        where: { cellId },
        include: {
          analyst: {
            include: {
              skills: true,
              certifications: true,
              specialties: true,
              cells: true
            }
          }
        }
      });
      
      // Transformar al formato de la aplicación
      return analystCells.map(ac => {
        const analyst = ac.analyst;
        return {
          id: analyst.id,
          name: analyst.name,
          email: analyst.email,
          role: this.mapDatabaseRoleToQARole(analyst.role),
          color: analyst.color || undefined,
          availability: analyst.availability || 100,
          skills: analyst.skills.map(skill => ({
            name: skill.name,
            level: skill.level as 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto'
          })),
          certifications: analyst.certifications.map(cert => ({
            name: cert.name,
            issuer: cert.issuer,
            date: cert.date.toISOString().split('T')[0]
          })),
          specialties: analyst.specialties.map(spec => spec.name),
          cellIds: analyst.cells.map(cell => cell.cellId)
        };
      });
    } catch (error) {
      console.error('Error getting analysts by cell ID from database:', error);
      return [];
    }
  }
}
