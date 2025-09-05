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
import { AnalystVacationsManagement } from "./AnalystVacationsManagement";
import { CalendarOff } from "lucide-react";

interface AnalystVacationsDialogProps {
  analyst: QAAnalyst;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: boolean; // Para mostrar el trigger button o no
}

export function AnalystVacationsDialog({ 
  analyst, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  trigger = true 
}: AnalystVacationsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Usar props externas si están disponibles, sino usar estado interno
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" title="Gestionar vacaciones">
            <CalendarOff className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Gestión de ausencias - {analyst.name}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <AnalystVacationsManagement analyst={analyst} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
