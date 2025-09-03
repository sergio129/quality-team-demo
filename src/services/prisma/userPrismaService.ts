import { prisma } from '@/lib/prisma';
import { User } from '@/models/User';
import { compareSync, hashSync } from 'bcryptjs';

export class UserPrismaService {
  // ──────────────────────────────────────────────────────────────────────────────
  // GET ALL USERS
  // ──────────────────────────────────────────────────────────────────────────────
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        include: {
          analyst: true,
        },
      });

      return users.map(user => {
        const userWithoutNulls: Record<string, any> = {};

        Object.entries(user).forEach(([key, value]) => {
          if (key === 'password') {
            return; // omit password
          } else if (key === 'analyst') {
            return; // handled separately
          }
          userWithoutNulls[key] = value === null ? undefined : value;
        });

        if (user.analyst) {
          const analystWithoutNulls: Record<string, any> = {};

          Object.entries(user.analyst).forEach(([key, value]) => {
            analystWithoutNulls[key] = value === null ? undefined : value;
          });

          analystWithoutNulls.cellIds = [];
          analystWithoutNulls.role =
            user.analyst.role as 'QA Analyst' | 'QA Senior' | 'QA Leader';

          userWithoutNulls.analyst = analystWithoutNulls;
        } else {
          userWithoutNulls.analyst = undefined;
        }

        return userWithoutNulls as User;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // GET USER BY ID
  // ──────────────────────────────────────────────────────────────────────────────
  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { analyst: true },
      });

      if (!user) return null;

      const userWithoutNulls: Record<string, any> = {};
      Object.entries(user).forEach(([key, value]) => {
        if (key === 'password' || key === 'analyst') return;
        userWithoutNulls[key] = value === null ? undefined : value;
      });

      if (user.analyst) {
        const analystWithoutNulls: Record<string, any> = {};
        Object.entries(user.analyst).forEach(([key, value]) => {
          analystWithoutNulls[key] = value === null ? undefined : value;
        });
        analystWithoutNulls.cellIds = [];
        analystWithoutNulls.role =
          user.analyst.role as 'QA Analyst' | 'QA Senior' | 'QA Leader';

        userWithoutNulls.analyst = analystWithoutNulls;
      } else {
        userWithoutNulls.analyst = undefined;
      }

      return userWithoutNulls as User;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // GET USER BY EMAIL
  // ──────────────────────────────────────────────────────────────────────────────
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { analyst: true },
      });

      if (!user) return null;

      const userWithoutNulls: Record<string, any> = {};
      Object.entries(user).forEach(([key, value]) => {
        if (key === 'analyst') return;
        userWithoutNulls[key] = value === null ? undefined : value;
      });

      if (user.analyst) {
        const analystWithoutNulls: Record<string, any> = {};
        Object.entries(user.analyst).forEach(([key, value]) => {
          analystWithoutNulls[key] = value === null ? undefined : value;
        });
        analystWithoutNulls.cellIds = [];
        analystWithoutNulls.role =
          user.analyst.role as 'QA Analyst' | 'QA Senior' | 'QA Leader';

        userWithoutNulls.analyst = analystWithoutNulls;
      } else {
        userWithoutNulls.analyst = undefined;
      }

      return userWithoutNulls as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // CREATE USER
  // ──────────────────────────────────────────────────────────────────────────────
  async createUser(userData: Partial<User>): Promise<User | null> {
    try {
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Email, password and name are required');
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      if (existingUser) throw new Error('Email already exists');

      // Manejar analystId correctamente - convertir cadena vacía a null
      const analystIdValue = userData.analystId && userData.analystId.trim() !== '' 
        ? userData.analystId 
        : null;

      if (analystIdValue) {
        const existingUserWithAnalyst = await prisma.user.findUnique({
          where: { analystId: analystIdValue },
        });
        if (existingUserWithAnalyst)
          throw new Error('This analyst already has a user account');
      }

      const hashedPassword = hashSync(userData.password, 10);

      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          isActive:
            userData.isActive !== undefined ? userData.isActive : true,
          analystId: analystIdValue,
        },
        include: { analyst: true },
      });

      const userWithoutNulls: Record<string, any> = {};
      Object.entries(newUser).forEach(([key, value]) => {
        if (key === 'password' || key === 'analyst') return;
        userWithoutNulls[key] = value === null ? undefined : value;
      });

      if (newUser.analyst) {
        const analystWithoutNulls: Record<string, any> = {};
        Object.entries(newUser.analyst).forEach(([key, value]) => {
          analystWithoutNulls[key] = value === null ? undefined : value;
        });
        analystWithoutNulls.cellIds = [];
        analystWithoutNulls.role =
          newUser.analyst.role as 'QA Analyst' | 'QA Senior' | 'QA Leader';

        userWithoutNulls.analyst = analystWithoutNulls;
      } else {
        userWithoutNulls.analyst = undefined;
      }

      return userWithoutNulls as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // UPDATE USER
  // ──────────────────────────────────────────────────────────────────────────────
  async updateUser(
    id: string,
    userData: Partial<User>,
  ): Promise<User | null> {
    try {
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) throw new Error('User not found');

      const updateData: any = {};
      if (userData.email) updateData.email = userData.email;
      if (userData.name) updateData.name = userData.name;
      if (userData.isActive !== undefined)
        updateData.isActive = userData.isActive;

      if (userData.password) {
        updateData.password = hashSync(userData.password, 10);
      }

      if (userData.analystId !== undefined) {
        // Si analystId es una cadena vacía o nula, establecer como null
        const analystIdValue = userData.analystId && userData.analystId.trim() !== '' 
          ? userData.analystId 
          : null;
        
        if (analystIdValue) {
          const existingUserWithAnalyst = await prisma.user.findUnique({
            where: { analystId: analystIdValue },
          });
          if (
            existingUserWithAnalyst &&
            existingUserWithAnalyst.id !== id
          ) {
            throw new Error('This analyst already has a user account');
          }
        }
        updateData.analystId = analystIdValue;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        include: { analyst: true },
      });

      const { password, lastLogin, analyst, analystId, ...rest } = updatedUser;
      const transformedAnalyst = analyst
        ? {
            ...analyst,
            cellIds: [],
            role: analyst.role as
              | 'QA Analyst'
              | 'QA Senior'
              | 'QA Leader',
            color: analyst.color || undefined,
            availability: analyst.availability || undefined,
          }
        : undefined;

      return {
        ...rest,
        lastLogin: lastLogin || undefined,
        analyst: transformedAnalyst,
        analystId: analystId || undefined,
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // DELETE USER
  // ──────────────────────────────────────────────────────────────────────────────
  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // VALIDATE CREDENTIALS
  // ──────────────────────────────────────────────────────────────────────────────
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user || !user.password) return null;

      const passwordValid = compareSync(password, user.password);
      if (!passwordValid) return null;

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const { password: _, lastLogin, analyst, analystId, ...rest } = user;
      const transformedAnalyst = analyst
        ? {
            ...analyst,
            cellIds: [],
            role: analyst.role as
              | 'QA Analyst'
              | 'QA Senior'
              | 'QA Leader',
            color: analyst.color || undefined,
            availability: analyst.availability || undefined,
          }
        : undefined;

      return {
        ...rest,
        lastLogin: lastLogin || undefined,
        analyst: transformedAnalyst,
        analystId: analystId || undefined,
      };
    } catch (error) {
      console.error('Error validating credentials:', error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // GET UNASSIGNED ANALYSTS
  // ──────────────────────────────────────────────────────────────────────────────
  async getUnassignedAnalysts() {
    try {
      const allAnalysts = await prisma.qAAnalyst.findMany({
        include: { user: true },
      });

      return allAnalysts
        .filter(analyst => !analyst.user)
        .map(({ user, ...analystData }) => analystData);
    } catch (error) {
      console.error('Error getting unassigned analysts:', error);
      throw error;
    }
  }
}
