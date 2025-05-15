'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TeamForm } from "./TeamForm";
import { useState } from "react";

export function AddTeamButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo Equipo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Equipo</DialogTitle>
        </DialogHeader>
        <TeamForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
