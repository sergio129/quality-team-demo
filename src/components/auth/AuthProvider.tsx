"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider 
      // Optimizar configuración de session provider
      refetchInterval={5 * 60} // Refetch cada 5 minutos en lugar del default
      refetchOnWindowFocus={false} // Evitar refetch excesivo en focus
      refetchWhenOffline={false} // No refetch cuando esté offline
    >
      {children}
    </SessionProvider>
  );
}
