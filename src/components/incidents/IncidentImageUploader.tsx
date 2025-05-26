'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface IncidentImageUploaderProps {
  incidentId: string;
  readOnly?: boolean;
}

interface ImageItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string;
  createdAt: string;
}

export default function IncidentImageUploader({ incidentId, readOnly = false }: IncidentImageUploaderProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Cargar las imágenes cuando el componente se monte o el incidentId cambie
  useEffect(() => {
    if (incidentId) {
      loadImages();
    }
  }, [incidentId]);

  // Función para cargar las imágenes del incidente
  const loadImages = async () => {
    if (!incidentId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/incidents/images?incidentId=${incidentId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar imágenes');
      }
      
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      toast.error('No se pudieron cargar las imágenes');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar la subida de una nueva imagen
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validar tipo de archivo (solo imágenes)
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es demasiado grande. El tamaño máximo es 5MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('incidentId', incidentId);
      formData.append('image', file);
      
      const response = await fetch('/api/incidents/images', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }
      
      // Recargar las imágenes después de subir una nueva
      await loadImages();
      toast.success('Imagen subida correctamente');
      
      // Limpiar el input
      e.target.value = '';
    } catch (error) {
      console.error('Error al subir imagen:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  // Función para eliminar una imagen
  const handleDelete = async (imageId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) return;
    
    try {
      const response = await fetch('/api/incidents/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageId })
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar la imagen');
      }
      
      // Actualizar el estado local eliminando la imagen
      setImages(prev => prev.filter(img => img.id !== imageId));
      
      // Si la imagen eliminada es la que se está previsualizando, cerrar la previsualización
      if (previewImage && previewImage.includes(imageId)) {
        setPreviewImage(null);
      }
      
      toast.success('Imagen eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      toast.error('Error al eliminar la imagen');
    }
  };

  // Función para previsualizar una imagen
  const handlePreview = (image: ImageItem) => {
    setPreviewImage(`data:${image.fileType};base64,${image.data}`);
  };

  // Calcular tamaño legible
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Imágenes adjuntas</h3>
        
        {!readOnly && (
          <div>
            <input
              type="file"
              id="image-upload"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
              disabled={isUploading}
            />
            <label htmlFor="image-upload">              <Button 
                type="button" 
                variant="outline" 
                disabled={isUploading}
                className="cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Adjuntar imagen
                  </>
                )}
              </Button>
            </label>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {images.map(image => (
            <div 
              key={image.id} 
              className="border rounded-md p-3 bg-gray-50 flex flex-col"
            >
              <div 
                className="relative h-32 bg-gray-200 rounded-md mb-2 cursor-pointer overflow-hidden"
                onClick={() => handlePreview(image)}
              >
                {image.fileType.startsWith('image/') ? (
                  <img 
                    src={`data:${image.fileType};base64,${image.data}`} 
                    alt={image.fileName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="mt-auto">
                <p className="text-sm font-medium truncate">{image.fileName}</p>
                <p className="text-xs text-gray-500">{formatSize(image.fileSize)}</p>
                
                <div className="flex justify-between mt-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handlePreview(image)}
                  >
                    Ver
                  </Button>
                  
                  {!readOnly && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(image.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed rounded-md">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-gray-500">No hay imágenes adjuntas</p>
          {!readOnly && (
            <p className="text-sm text-gray-400">Haz clic en "Adjuntar imagen" para añadir</p>
          )}
        </div>
      )}
      
      {/* Modal de previsualización */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-screen w-full">
            <Button 
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70 z-10"
            >
              <X className="h-5 w-5" />
            </Button>
            <img 
              src={previewImage} 
              alt="Vista previa" 
              className="max-w-full max-h-[90vh] mx-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
