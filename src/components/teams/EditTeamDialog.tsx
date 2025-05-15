'use client';

import { Team } from "@/models/Team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TeamForm } from "./TeamForm";

interface EditTeamDialogProps {
  team: Team;
  onSave: () => void;
}

export function EditTeamDialog({ team, onSave }: EditTeamDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        <TeamForm team={team} onSave={onSave} />
      </DialogContent>
    </Dialog>
  );
}
