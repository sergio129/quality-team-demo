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

export function AddAnalystButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Agregar Analista</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Analista</DialogTitle>
        </DialogHeader>
        <AnalystForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
