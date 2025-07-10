import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// Crear el manejador de autenticación con las opciones importadas
const handler = NextAuth(authOptions);

// Exportar los métodos GET y POST
export { handler as GET, handler as POST };
