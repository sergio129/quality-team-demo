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
}

export function AnalystVacationsDialog({ analyst }: AnalystVacationsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Gestionar vacaciones">
          <CalendarOff className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestión de ausencias - {analyst.name}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <AnalystVacationsManagement analyst={analyst} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
