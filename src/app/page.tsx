import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export default async function Home() {
  try {
    // Obtener la sesión directamente para evitar problemas de importación
    const session = await getServerSession(authOptions);
    
    // Si no hay usuario autenticado, redirigir al login
    if (!session?.user) {
      return redirect('/login');
    }
    
    // Si hay un usuario autenticado, redirigir a la página de proyectos
    return redirect('/proyectos');
  } catch (error) {
    console.error("Error en la página principal:", error);
    // En caso de error, redirigir al login
    return redirect('/login');
  }
}
