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
      <div className="space-y-1.5">        {certifications.length > 0 ? (
          certifications.map((cert, index) => (
            <div key={index} className="flex items-center justify-between p-1 bg-gray-50 rounded-md border border-gray-100 text-xs">
              <div>
                <div className="font-medium text-xs leading-tight">{cert.name}</div>
                <div className="text-[10px] text-gray-600 flex flex-wrap items-center gap-1">
                  <span className="bg-blue-50 px-1 py-0.5 rounded-sm text-blue-700 text-[10px]">{cert.issuer}</span>
                  <span className="text-[9px] text-gray-500 flex items-center">
                    <Calendar className="h-2 w-2 mr-0.5 inline" /> 
                    {new Date(cert.date).toLocaleDateString()}
                    {cert.expiryDate && ` → ${new Date(cert.expiryDate).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRemoveCertification(index)}
                className="text-gray-400 hover:text-red-500 p-0.5"
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
        <div className="border p-1.5 rounded-md bg-gray-50 text-xs">
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cert-name" className="text-xs mb-0.5 block">Certificación</Label>
                <Input
                  id="cert-name"
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  placeholder="ISTQB Foundation Level"
                  className="h-6 text-xs px-2"
                />
              </div>
              
              <div>
                <Label htmlFor="cert-issuer" className="text-xs mb-0.5 block">Entidad</Label>
                <Input
                  id="cert-issuer"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  placeholder="ISTQB"
                  className="h-6 text-xs px-2"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cert-date" className="text-xs mb-0.5 block">Fecha obtención</Label>
                <Input
                  id="cert-date"
                  type="date"
                  value={newCert.date}
                  onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                  className="h-6 text-xs px-2"
                />
              </div>
              
              <div>
                <Label htmlFor="cert-expiry" className="text-xs mb-0.5 block">Expiración (opc.)</Label>
                <Input
                  id="cert-expiry"
                  type="date"
                  value={newCert.expiryDate || ''}
                  onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value || undefined })}
                  className="h-6 text-xs px-2"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-1 mt-1">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowForm(false)}
                className="h-6 text-xs py-0 px-2"
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleAddCertification}
                disabled={!newCert.name.trim() || !newCert.issuer.trim()}
                className="h-6 text-xs py-0 px-2"
              >
                Añadir
              </Button>
            </div>
          </div>
        </div>      ) : (
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowForm(true)}
          className="w-full h-6 text-xs"
        >
          <Plus className="h-2.5 w-2.5 mr-1" /> Añadir Certificación
        </Button>
      )}
    </div>
  );
}
