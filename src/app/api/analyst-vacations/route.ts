import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Ruta para el archivo de vacaciones
const VACATIONS_FILE = path.join(process.cwd(), 'data', 'analyst-vacations.json');

// Asegurar que el archivo existe
const ensureVacationsFileExists = () => {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Crear directorio si no existe
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Crear archivo si no existe
  if (!fs.existsSync(VACATIONS_FILE)) {
    fs.writeFileSync(VACATIONS_FILE, JSON.stringify([]));
  }
};

// Leer datos de vacaciones
const getVacations = () => {
  ensureVacationsFileExists();
  
  try {
    const rawData = fs.readFileSync(VACATIONS_FILE, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error al leer archivo de vacaciones:', error);
    return [];
  }
};

// Guardar datos de vacaciones
const saveVacations = (data: any[]) => {
  ensureVacationsFileExists();
  
  try {
    fs.writeFileSync(VACATIONS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error al guardar archivo de vacaciones:', error);
    return false;
  }
};

// Handler para GET - Obtener todas las vacaciones o filtrar por analista
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const analystId = url.searchParams.get('analystId');
  
  const vacations = getVacations();
  
  if (analystId) {
    const filtered = vacations.filter((v: any) => v.analystId === analystId);
    return NextResponse.json(filtered);
  }
  
  return NextResponse.json(vacations);
}

// Handler para POST - Crear un nuevo período de vacaciones
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validar datos
    if (!data.analystId || !data.startDate || !data.endDate || !data.type) {
      return NextResponse.json({
        error: 'Faltan campos obligatorios'
      }, { status: 400 });
    }
    
    // Crear objeto de vacaciones
    const newVacation = {
      id: uuidv4(),
      analystId: data.analystId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      description: data.description || '',
      type: data.type
    };
    
    // Obtener vacaciones existentes y agregar la nueva
    const vacations = getVacations();
    vacations.push(newVacation);
    
    // Guardar cambios
    if (saveVacations(vacations)) {
      return NextResponse.json(newVacation);
    } else {
      return NextResponse.json({
        error: 'Error al guardar las vacaciones'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error en POST de vacaciones:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Handler para DELETE - Eliminar un período de vacaciones
export async function DELETE(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.id) {
      return NextResponse.json({
        error: 'Se requiere el ID de las vacaciones'
      }, { status: 400 });
    }
    
    const vacations = getVacations();
    const updatedVacations = vacations.filter((v: any) => v.id !== data.id);
    
    // Verificar si se encontró el registro
    if (vacations.length === updatedVacations.length) {
      return NextResponse.json({
        error: 'No se encontró el registro de vacaciones'
      }, { status: 404 });
    }
    
    // Guardar cambios
    if (saveVacations(updatedVacations)) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({
        error: 'Error al eliminar las vacaciones'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error en DELETE de vacaciones:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
