'use client';

import { useState } from "react";
import { Team } from "@/models/Team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface TeamFormProps {
  team?: Team;
  onSave?: () => void;
}

export function TeamForm({ team, onSave }: TeamFormProps) {
  const router = useRouter();
  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = '/api/teams';
    const method = team ? 'PUT' : 'POST';
    const body = team 
      ? JSON.stringify({ id: team.id, name, description })
      : JSON.stringify({ name, description });

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.ok) {
      if (onSave) {
        onSave();
      } else {
        router.refresh();
      }
      // Close the dialog - assuming it's rendered in a dialog
      const closeButton = document.querySelector('[data-dialog-close]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter team name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter team description"
        />
      </div>
      <Button type="submit">
        {team ? 'Save Changes' : 'Create Team'}
      </Button>
    </form>
  );
}
