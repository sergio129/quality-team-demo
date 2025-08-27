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
import { TeamInfo } from "@/hooks/useCells";
import { Edit, Building } from 'lucide-react';
import { motion } from 'framer-motion';

interface EditCellDialogProps {
  cell: Cell;
  onSave?: () => void; // Ahora es opcional porque SWR se encargará de revalidar
  teams: TeamInfo[];
}

export function EditCellDialog({ cell, onSave, teams }: EditCellDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building className="h-6 w-6 text-blue-600" />
            Editar Célula: {cell.name}
          </DialogTitle>
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
