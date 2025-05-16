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
import { AnalystForm } from "@/components/analysts/AnalystForm";

interface EditAnalystDialogProps {
  analyst: QAAnalyst;
  onSave: () => void;
  cells: { id: string; name: string; }[];
}

export function EditAnalystDialog({ analyst, onSave, cells }: EditAnalystDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Editar Analista</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <AnalystForm 
            analyst={analyst} 
            onSave={onSave}
            cells={cells}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
