import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  // Obtener información del usuario autenticado
  const user = await getCurrentUser();
  
  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    redirect('/login');
  }
  
  // Si hay un usuario autenticado, redirigir a la página de proyectos
  redirect('/proyectos');
}
