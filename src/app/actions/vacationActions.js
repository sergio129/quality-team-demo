/**
 * API route para obtener vacaciones directamente usando serverActions
 */
"use server";

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Función para obtener todas las vacaciones
export async function getVacationsDirectly() {
  const prisma = new PrismaClient();
  
  try {
    const vacations = await prisma.analystVacation.findMany();
    
    // Formatear las fechas como objetos Date para mantener compatibilidad
    return vacations.map(v => ({
      ...v,
      startDate: new Date(v.startDate),
      endDate: new Date(v.endDate)
    }));
  } catch (error) {
    console.error('Error al obtener vacaciones directamente:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// Función para obtener vacaciones por analista
export async function getVacationsByAnalystDirectly(analystId) {
  const prisma = new PrismaClient();
  
  try {
    const vacations = await prisma.analystVacation.findMany({
      where: { analystId }
    });
    
    return vacations.map(v => ({
      ...v,
      startDate: new Date(v.startDate),
      endDate: new Date(v.endDate)
    }));
  } catch (error) {
    console.error(`Error al obtener vacaciones para analista ${analystId}:`, error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// Función para crear una nueva vacación
export async function createVacationDirectly(vacationData) {
  const prisma = new PrismaClient();
  
  try {
    const result = await prisma.analystVacation.create({
      data: {
        analystId: vacationData.analystId,
        startDate: vacationData.startDate,
        endDate: vacationData.endDate,
        description: vacationData.description || '',
        type: vacationData.type
      }
    });
    
    revalidatePath('/');
    
    return {
      ...result,
      startDate: new Date(result.startDate),
      endDate: new Date(result.endDate)
    };
  } catch (error) {
    console.error('Error al crear vacación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función para eliminar una vacación
export async function deleteVacationDirectly(id) {
  const prisma = new PrismaClient();
  
  try {
    await prisma.analystVacation.delete({
      where: { id }
    });
    
    revalidatePath('/');
    
    return true;
  } catch (error) {
    console.error(`Error al eliminar vacación ${id}:`, error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}
