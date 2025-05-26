'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, Image as ImageIcon, FileText, File, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface IncidentImageUploaderProps {
  incidentId: string;
  readOnly?: boolean;
}

interface FileItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string;
  createdAt: string;
}

export default function IncidentImageUploader({ incidentId, readOnly = false }: IncidentImageUploaderProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  // Cargar los archivos cuando el componente se monte o el incidentId cambie
  useEffect(() => {
    if (incidentId) {
      loadFiles();
    }
  }, [incidentId]);  // Función para cargar los archivos del incidente
  const loadFiles = async () => {
    if (!incidentId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/incidents/images?incidentId=${incidentId}`);
      
      if (!response.ok) {
        // Si el código es 500 pero es porque no hay archivos, simplemente iniciar con array vacío
        if (response.status === 500) {
          console.warn('No hay archivos para este incidente o ocurrió un error menor');
          setFiles([]);
          return;
        }
        throw new Error('Error al cargar archivos');
      }
      
      const data = await response.json();
      
      // Asegurar que data sea un array, incluso si la respuesta es un objeto de error
      if (Array.isArray(data)) {
        setFiles(data);
      } else {
        console.warn('Respuesta inesperada al cargar archivos:', data);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      toast.error('No se pudieron cargar los archivos');
      // Si ocurre un error, inicializar con array vacío para evitar problemas de renderizado
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para manejar la subida de un nuevo archivo
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. El tamaño máximo es 10MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('incidentId', incidentId);
      formData.append('file', file);
      
      // Usar el nuevo endpoint que hemos creado para evitar problemas con Prisma
      const response = await fetch('/api/incidents/upload-file', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }
      
      // Recargar los archivos después de subir uno nuevo
      await loadFiles();
      toast.success('Archivo subido correctamente');
      
      // Limpiar el input
      e.target.value = '';
    } catch (error) {
      console.error('Error al subir archivo:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };
  // Función para eliminar un archivo
  const handleDelete = async (fileId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este archivo?')) return;
    
    try {
      const response = await fetch('/api/incidents/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageId: fileId })
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar el archivo');
      }
      
      // Actualizar el estado local eliminando el archivo
      setFiles(prev => prev.filter(file => file.id !== fileId));
      
      // Si el archivo eliminado es el que se está previsualizando, cerrar la previsualización
      if (previewFile && previewFile.includes(fileId)) {
        setPreviewFile(null);
      }
      
      toast.success('Archivo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      toast.error('Error al eliminar el archivo');
    }
  };
  // Función para previsualizar un archivo
  const handlePreview = (file: FileItem) => {
    setPreviewFile(`data:${file.fileType};base64,${file.data}`);
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
        <h3 className="text-lg font-medium">Archivos adjuntos</h3>
        
        {!readOnly && (
          <div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
            <label htmlFor="file-upload">
              <Button 
                type="button" 
                variant="outline" 
                disabled={isUploading}
                className="cursor-pointer"
                asChild
              >
                <span>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Adjuntar archivo
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        )}
      </div>
        {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map(file => (
            <div 
              key={file.id} 
              className="border rounded-md p-3 bg-gray-50 flex flex-col"
            >
              <div 
                className="relative h-32 bg-gray-200 rounded-md mb-2 cursor-pointer overflow-hidden"
                onClick={() => handlePreview(file)}
              >
                {file.fileType.startsWith('image/') ? (
                  <img 
                    src={`data:${file.fileType};base64,${file.data}`} 
                    alt={file.fileName}
                    className="w-full h-full object-contain"
                  />
                ) : file.fileType.includes('pdf') ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileText className="h-12 w-12 text-red-400" />
                    <span className="text-xs mt-1">PDF</span>
                  </div>
                ) : file.fileType.includes('word') || file.fileType.includes('doc') ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileText className="h-12 w-12 text-blue-400" />
                    <span className="text-xs mt-1">DOC</span>
                  </div>
                ) : file.fileType.includes('excel') || file.fileType.includes('sheet') || file.fileType.includes('xls') ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileText className="h-12 w-12 text-green-400" />
                    <span className="text-xs mt-1">XLS</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <File className="h-12 w-12 text-gray-400" />
                    <span className="text-xs mt-1">Archivo</span>
                  </div>
                )}
              </div>
              
              <div className="mt-auto">
                <p className="text-sm font-medium truncate">{file.fileName}</p>
                <p className="text-xs text-gray-500">{formatSize(file.fileSize)}</p>
                
                <div className="flex justify-between mt-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handlePreview(file)}
                  >
                    Ver
                  </Button>
                  
                  {!readOnly && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(file.id)}
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
          <File className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-gray-500">No hay archivos adjuntos</p>
          {!readOnly && (
            <p className="text-sm text-gray-400">Haz clic en "Adjuntar archivo" para añadir</p>
          )}
        </div>
      )}
        {/* Modal de previsualización */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-screen w-full">
            <Button 
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPreviewFile(null)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70 z-10"
            >
              <X className="h-5 w-5" />
            </Button>
            {previewFile.startsWith('data:image') ? (
              <img 
                src={previewFile} 
                alt="Vista previa" 
                className="max-w-full max-h-[90vh] mx-auto object-contain"
              />
            ) : previewFile.startsWith('data:application/pdf') ? (
              <iframe 
                src={previewFile} 
                className="bg-white w-full h-[90vh]" 
                title="Vista previa PDF"
              />
            ) : (
              <div className="bg-white p-8 rounded-md text-center">
                <File className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Este tipo de archivo no puede ser previsualizado</p>
                <p className="text-gray-500">Descarga el archivo para verlo</p>
                <a 
                  href={previewFile} 
                  download 
                  className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Descargar archivo
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
