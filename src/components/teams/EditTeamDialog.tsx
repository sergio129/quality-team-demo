'use client';

import { Team } from "@/models/Team";
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

interface EditTeamDialogProps {
  team: Team;
  onSave?: () => void; // Ahora es opcional porque SWR se encargará de revalidar
}

export function EditTeamDialog({ team, onSave }: EditTeamDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Equipo</DialogTitle>
        </DialogHeader>
        <TeamForm 
          team={team} 
          onSave={onSave} 
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
