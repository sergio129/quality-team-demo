'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useQAAnalysts } from '@/hooks/useQAAnalysts';
import { useBulkAssignment } from '@/hooks/useBulkAssignment';
import { Checkbox } from '@/components/ui/checkbox';

interface BulkAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  testPlanId?: string;
  selectedTestCaseIds?: string[];
}

export default function BulkAssignmentDialog({
  isOpen,
  onClose,
  projectId,
  testPlanId,
  selectedTestCaseIds = []
}: BulkAssignmentDialogProps) {
  const { analysts, isLoading: loadingAnalysts } = useQAAnalysts();
  const { assignResponsiblePersonByIds, assignResponsiblePersonByFilters } = useBulkAssignment();
  
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [onlyNull, setOnlyNull] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsiblePerson) return;
    
    setIsSubmitting(true);
    try {      // Si hay IDs seleccionados, asignar solo a ellos
      if (selectedTestCaseIds && selectedTestCaseIds.length > 0) {
        await assignResponsiblePersonByIds(selectedTestCaseIds, responsiblePerson);
      }
      // Si no hay IDs seleccionados, aplicar a todos los casos que cumplan con los filtros
      else {        await assignResponsiblePersonByFilters(responsiblePerson, {
          projectId,
          testPlanId,
          onlyNull: onlyNull
        });
      }
      onClose();
    } catch (error) {
      console.error('Error al asignar persona responsable:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>            {selectedTestCaseIds.length > 0
              ? `Asignar persona responsable a ${selectedTestCaseIds.length} caso(s)`
              : 'Asignación masiva de persona responsable'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="responsiblePerson">Persona Responsable</Label>
            <Select
              id="responsiblePerson"
              value={responsiblePerson}
              onChange={(e) => setResponsiblePerson(e.target.value)}
              disabled={loadingAnalysts || isSubmitting}
              required
            >              <option value="">Seleccione un analista</option>
              {analysts.map((analyst) => (
                <option key={analyst.id} value={analyst.name}>
                  {analyst.name}
                </option>
              ))}
            </Select>
          </div>
          
          {selectedTestCaseIds.length === 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyNull"
                checked={onlyNull}
                onCheckedChange={(checked: boolean) => setOnlyNull(checked)}
              />
              <Label htmlFor="onlyNull">
                Solo asignar a casos sin persona responsable
              </Label>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!responsiblePerson || isSubmitting}
            >
              Asignar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
