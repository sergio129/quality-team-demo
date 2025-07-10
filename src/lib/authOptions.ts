import { PrismaAdapter } from "@auth/prisma-adapter";
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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
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
