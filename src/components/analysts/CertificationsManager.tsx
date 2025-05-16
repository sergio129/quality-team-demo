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
    <div className="space-y-3">
      {/* Lista de certificaciones */}
      <div className="space-y-1.5">
        {certifications.length > 0 ? (
          certifications.map((cert, index) => (
            <div key={index} className="flex items-center justify-between p-1.5 bg-gray-50 rounded-md border border-gray-100 text-sm">
              <div>
                <div className="font-medium text-xs">{cert.name}</div>
                <div className="text-xs text-gray-600 flex flex-wrap items-center gap-1">
                  <span className="bg-blue-50 px-1.5 py-0.5 rounded-sm text-blue-700">{cert.issuer}</span>
                  <span className="text-[10px] text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-0.5 inline" /> 
                    {new Date(cert.date).toLocaleDateString()}
                    {cert.expiryDate && ` → ${new Date(cert.expiryDate).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRemoveCertification(index)}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-500 italic">No hay certificaciones registradas</div>
        )}
      </div>      {/* Formulario para añadir certificación */}
      {showForm ? (
        <div className="border p-2 rounded-md bg-gray-50 text-sm">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cert-name" className="text-xs">Certificación</Label>
                <Input
                  id="cert-name"
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  placeholder="ISTQB Foundation Level"
                  className="h-7 text-xs"
                />
              </div>
              
              <div>
                <Label htmlFor="cert-issuer" className="text-xs">Entidad</Label>
                <Input
                  id="cert-issuer"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  placeholder="ISTQB"
                  className="h-7 text-xs"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cert-date" className="text-xs">Fecha obtención</Label>
                <Input
                  id="cert-date"
                  type="date"
                  value={newCert.date}
                  onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>
              
              <div>
                <Label htmlFor="cert-expiry" className="text-xs">Expiración (opcional)</Label>
                <Input
                  id="cert-expiry"
                  type="date"
                  value={newCert.expiryDate || ''}
                  onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value || undefined })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-1.5 mt-1">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowForm(false)}
                className="h-7 text-xs py-0"
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleAddCertification}
                disabled={!newCert.name.trim() || !newCert.issuer.trim()}
                className="h-7 text-xs py-0"
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
          className="w-full h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Añadir Certificación
        </Button>
      )}
    </div>
  );
}
