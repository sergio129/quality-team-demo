'use client';

import { Button } from '@/components/ui/button';

export function NewIncidentButton() {
    const handleClick = () => {
        // Simulamos un clic en el botón "Nuevo Incidente" del componente IncidentTable
        const newIncidentBtn = document.querySelector('[data-test-id="new-incident-btn"]');
        if (newIncidentBtn instanceof HTMLElement) {
            newIncidentBtn.click();
        }
    };

    return (
        <Button className="mb-4" onClick={handleClick}>
            Nuevo Incidente
        </Button>
    );
}
