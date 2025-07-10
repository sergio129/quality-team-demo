"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ReactNode } from "react";

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" richColors />
    </SessionProvider>
  );
}
