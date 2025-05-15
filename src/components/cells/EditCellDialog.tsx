'use client';

import { Cell } from "@/models/Cell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CellForm } from "./CellForm";

interface EditCellDialogProps {
  cell: Cell;
  onSave: () => void;
  teams: { id: string; name: string; }[];
}

export function EditCellDialog({ cell, onSave, teams }: EditCellDialogProps) {
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
          <DialogTitle>Editar Célula</DialogTitle>
        </DialogHeader>
        <CellForm 
          cell={cell} 
          onSave={onSave} 
          teams={teams} 
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
