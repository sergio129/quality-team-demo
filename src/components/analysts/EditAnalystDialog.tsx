'use client';

import { QAAnalyst } from "@/models/QAAnalyst";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { AnalystForm } from "./AnalystForm";

interface EditAnalystDialogProps {
  analyst: QAAnalyst;
  onSave: () => void;
  cells: { id: string; name: string; teamId: string; }[];
}

export function EditAnalystDialog({ analyst, onSave, cells }: EditAnalystDialogProps) {
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
          <DialogTitle>Editar Analista</DialogTitle>
        </DialogHeader>
        <AnalystForm 
          analyst={analyst} 
          onSave={onSave}
          cells={cells}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
