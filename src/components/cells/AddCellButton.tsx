'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CellForm } from "./CellForm";

interface TeamInfo {
  id: string;
  name: string;
}

export function AddCellButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Agregar Célula</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Célula</DialogTitle>
        </DialogHeader>
        <CellForm />
      </DialogContent>
    </Dialog>
  );
}
