// Script para resolver específicamente los problemas con el proyecto BCBH-504
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProject() {
  const idJira = 'BCBH-504';
  
  try {
    console.log(`Buscando proyecto ${idJira}...`);
    
    // Primero buscar el proyecto por idJira para obtener su ID interno
    const existingProject = await prisma.project.findFirst({
      where: { idJira },
      include: {
        team: true,
        cell: true,
        analysts: true
      }
    });
    
    if (!existingProject) {
      console.log(`❌ Proyecto con idJira ${idJira} no encontrado`);
      return;
    }
    
    console.log(`✅ Proyecto encontrado con ID: ${existingProject.id}`);
    console.log('Estado actual:');
    console.log({
      id: existingProject.id,
      idJira: existingProject.idJira,
      proyecto: existingProject.proyecto,
      estado: existingProject.estado,
      estadoCalculado: existingProject.estadoCalculado,
      equipoId: existingProject.equipoId,
      celulaId: existingProject.celulaId
    });
    
    // Actualizar el proyecto con los datos del objeto nuevo
    const updateData = {
      idJira: 'BCBH-504',
      proyecto: 'COT-DLLO-Desarrollo Ajustes en el Chat Crédito Hipotecario',
      estado: 'pendiente',
      estadoCalculado: 'Por Iniciar',
      horas: 15,
      dias: 2,
      fechaEntrega: new Date('2025-06-03'),
      fechaCertificacion: new Date('2025-06-06'),
      diasRetraso: 0,
      analistaProducto: 'Yulieth Paola',
      planTrabajo: 'BCBH-504'
    };
    
    console.log('Actualizando con datos:');
    console.log(updateData);
    
    // Actualizar el proyecto usando el ID interno
    const updatedProject = await prisma.project.update({
      where: { id: existingProject.id },
      data: updateData
    });
    
    console.log(`✅ Proyecto ${idJira} actualizado correctamente`);
    console.log('Nuevo estado:');
    console.log({
      id: updatedProject.id,
      idJira: updatedProject.idJira,
      proyecto: updatedProject.proyecto,
      estado: updatedProject.estado,
      estadoCalculado: updatedProject.estadoCalculado
    });
    
    return updatedProject;
  } catch (error) {
    console.error(`❌ Error actualizando proyecto ${idJira}:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
fixProject()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
