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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: boolean;
}

export function AnalystWorkloadDialog({ 
  analyst, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  trigger = true 
}: AnalystWorkloadDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [key, setKey] = useState(0);
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  
  // Cuando se abre el diálogo, incrementamos la key para forzar la re-renderización
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setKey(prevKey => prevKey + 1);
    }
    
    if (externalOnOpenChange) {
      externalOnOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" title="Ver proyectos asignados">
            <LayoutPanelLeft className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
