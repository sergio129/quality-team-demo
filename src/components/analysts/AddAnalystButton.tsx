'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AnalystForm } from "./AnalystForm";

interface CellInfo {
  id: string;
  name: string;
  teamId: string;
}

export function AddAnalystButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Agregar Analista</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Analista</DialogTitle>
        </DialogHeader>
        <AnalystForm />
      </DialogContent>
    </Dialog>
  );
}
