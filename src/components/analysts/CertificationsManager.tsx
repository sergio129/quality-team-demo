'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Certification } from '@/models/QAAnalyst';
import { X, Plus, Calendar } from 'lucide-react';

interface CertificationsManagerProps {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
}

export function CertificationsManager({ certifications, onChange }: CertificationsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newCert, setNewCert] = useState<Certification>({
    name: '',
    issuer: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddCertification = () => {
    if (!newCert.name.trim() || !newCert.issuer.trim()) return;
    
    const updatedCertifications = [...certifications, { ...newCert }];
    onChange(updatedCertifications);
    setNewCert({
      name: '',
      issuer: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
  };

  const handleRemoveCertification = (index: number) => {
    const updated = [...certifications];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Lista de certificaciones */}
      <div className="space-y-2">
        {certifications.length > 0 ? (
          certifications.map((cert, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div>
                <div className="font-medium">{cert.name}</div>
                <div className="text-sm text-gray-600">
                  {cert.issuer} • Obtenida: {new Date(cert.date).toLocaleDateString()}
                  {cert.expiryDate && ` • Expira: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                </div>
              </div>
              <button
                onClick={() => handleRemoveCertification(index)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">No hay certificaciones registradas</div>
        )}
      </div>

      {/* Formulario para añadir certificación */}
      {showForm ? (
        <div className="border p-3 rounded-md bg-gray-50">
          <div className="space-y-3">
            <div>
              <Label htmlFor="cert-name">Nombre de la Certificación</Label>
              <Input
                id="cert-name"
                value={newCert.name}
                onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                placeholder="ISTQB Foundation Level"
              />
            </div>
            
            <div>
              <Label htmlFor="cert-issuer">Entidad Emisora</Label>
              <Input
                id="cert-issuer"
                value={newCert.issuer}
                onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                placeholder="ISTQB"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cert-date">Fecha de Obtención</Label>
                <Input
                  id="cert-date"
                  type="date"
                  value={newCert.date}
                  onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="cert-expiry">Fecha de Expiración (opcional)</Label>
                <Input
                  id="cert-expiry"
                  type="date"
                  value={newCert.expiryDate || ''}
                  onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value || undefined })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleAddCertification}
                disabled={!newCert.name.trim() || !newCert.issuer.trim()}
              >
                Añadir
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" /> Añadir Certificación
        </Button>
      )}
    </div>
  );
}
