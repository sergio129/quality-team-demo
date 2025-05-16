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
import { AnalystPerformance } from "./AnalystPerformance";
import { BarChart2 } from "lucide-react";

interface AnalystStatsDialogProps {
  analyst: QAAnalyst;
}

export function AnalystStatsDialog({ analyst }: AnalystStatsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Ver estadísticas">
          <BarChart2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Estadísticas de {analyst.name}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <AnalystPerformance analystId={analyst.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
