import { prisma } from '@/lib/prisma';
import { User } from '@/models/User';
import { compareSync, hashSync } from 'bcryptjs';

export class UserPrismaService {
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        include: {
          analyst: true
        }
      });
      
      // No devolver las contraseñas
      return users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          analyst: true
        }
      });

      if (!user) return null;
      
      // No devolver la contraseña
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          analyst: true
        }
      });
      
      if (!user) return null;

      // Aquí mantenemos la contraseña porque puede ser necesaria para autenticación
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async createUser(userData: Partial<User>): Promise<User | null> {
    try {
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Email, password and name are required');
      }

      // Comprobar si el email ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Verificar si el analista ya tiene un usuario asociado
      if (userData.analystId) {
        const existingUserWithAnalyst = await prisma.user.findUnique({
          where: { analystId: userData.analystId }
        });

        if (existingUserWithAnalyst) {
          throw new Error('This analyst already has a user account');
        }
      }

      // Encriptar contraseña
      const hashedPassword = hashSync(userData.password, 10);

      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          analystId: userData.analystId || null
        },
        include: {
          analyst: true
        }
      });

      // No devolver la contraseña
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    try {
      // Verificar si el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Preparar datos para actualización
      const updateData: any = {};
      
      if (userData.email) updateData.email = userData.email;
      if (userData.name) updateData.name = userData.name;
      if (userData.isActive !== undefined) updateData.isActive = userData.isActive;
      
      // Si hay nueva contraseña, encriptarla
      if (userData.password) {
        updateData.password = hashSync(userData.password, 10);
      }

      // Si hay cambio en el analista vinculado
      if (userData.analystId !== undefined) {
        // Si se está asignando un analista
        if (userData.analystId) {
          // Verificar si el analista ya tiene un usuario
          const existingUserWithAnalyst = await prisma.user.findUnique({
            where: { analystId: userData.analystId }
          });

          if (existingUserWithAnalyst && existingUserWithAnalyst.id !== id) {
            throw new Error('This analyst already has a user account');
          }
        }
        
        updateData.analystId = userData.analystId;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          analyst: true
        }
      });

      // No devolver la contraseña
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user || !user.password) {
        return null;
      }

      const passwordValid = compareSync(password, user.password);
      
      if (!passwordValid) {
        return null;
      }

      // Actualizar último login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // No devolver la contraseña
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error validating credentials:', error);
      throw error;
    }
  }

  async getUnassignedAnalysts() {
    try {
      // Buscar analistas que no tengan usuario asociado
      const analysts = await prisma.qAAnalyst.findMany({
        where: {
          user: null
        }
      });
      
      return analysts;
    } catch (error) {
      console.error('Error getting unassigned analysts:', error);
      throw error;
    }
  }
}
