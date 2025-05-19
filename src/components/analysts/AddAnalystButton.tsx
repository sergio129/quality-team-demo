'use client';

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
import { useCells } from "@/hooks/useAnalysts";

export function AddAnalystButton() {
  const [open, setOpen] = useState(false);
  const { cells } = useCells();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Agregar Analista</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Agregar Nuevo Analista</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <AnalystForm 
            cells={cells}
            onSuccess={() => setOpen(false)} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
