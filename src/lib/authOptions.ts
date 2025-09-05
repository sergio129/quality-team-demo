import { prisma } from "@/lib/prisma";
import { UserPrismaService } from "@/services/prisma/userPrismaService";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

const userService = new UserPrismaService();

// Define login schema validation
const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Contraseña debe tener al menos 6 caracteres" }),
});

// Generamos una clave secreta por defecto para desarrollo
// En producción, DEBE configurarse NEXTAUTH_SECRET en las variables de entorno
const generateSecret = () => {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
  
  console.warn('¡ADVERTENCIA! No se ha configurado NEXTAUTH_SECRET. Usando una clave generada por defecto. NO usar en producción.');
  return 'ClaveGeneradaParaDesarrolloLocalNoUsarEnProduccion123';
};

export const authOptions: NextAuthOptions = {
  // Configuración optimizada usando JWT con cache mejorado
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 60 * 60, // Actualizar sesión cada hora en lugar de cada request
  },
  // Configurar cookies optimizadas
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Optimizar tiempo de vida de cookies
        maxAge: 8 * 60 * 60, // 8 horas
      }
    }
  },
  secret: generateSecret(),
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) {
            return null;
          }
          
          // Validate input data
          const validatedData = loginSchema.safeParse(credentials);
          if (!validatedData.success) {
            return null;
          }

          // Validate credentials with our service
          const user = await userService.validateCredentials(
            credentials.email,
            credentials.password
          );

          if (!user) {
            return null;
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error("Usuario desactivado. Contacte al administrador");
          }

          // Return the user data in the format expected by NextAuth
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.analyst?.role || "No Role",
            analystId: user.analystId,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Error de autenticación");
        }
      },
    }),
  ],
  callbacks: {
    // Include user role and analystId in the session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.analystId = token.analystId as string | undefined;
      }
      return session;
    },
    // Include role and analystId in the token
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.analystId = user.analystId;
      }
      return token;
    },
  },
};
