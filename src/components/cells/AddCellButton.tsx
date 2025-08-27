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
import { CellForm } from "@/components/cells/CellForm";
import { Plus, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export function AddCellButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="h-4 w-4" />
            Agregar Célula
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6 text-blue-600" />
            Crear Nueva Célula
          </DialogTitle>
        </DialogHeader>
        <CellForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
