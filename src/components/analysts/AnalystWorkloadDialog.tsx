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
import { AnalystWorkload } from "./AnalystWorkload";
import { LayoutPanelLeft } from "lucide-react";

interface AnalystWorkloadDialogProps {
  analyst: QAAnalyst;
}

export function AnalystWorkloadDialog({ analyst }: AnalystWorkloadDialogProps) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0); // Añadir un key para forzar el refresco

  // Cuando se abre el diálogo, incrementamos la key para forzar la re-renderización del componente
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setKey(prevKey => prevKey + 1);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Ver proyectos asignados">
          <LayoutPanelLeft className="h-4 w-4" />
        </Button>
      </DialogTrigger>      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Proyectos Asignados a {analyst.name}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <AnalystWorkload key={key} analystId={analyst.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
