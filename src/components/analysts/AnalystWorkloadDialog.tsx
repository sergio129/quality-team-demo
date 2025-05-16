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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Ver proyectos asignados">
          <LayoutPanelLeft className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Proyectos Asignados a {analyst.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <AnalystWorkload analystId={analyst.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
