'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, Image as ImageIcon, FileText, File, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileAdd: (file: TempFileItem) => void;
  onFileRemove: (fileId: string) => void;
  files: TempFileItem[];
  readOnly?: boolean;
}

export interface TempFileItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  file: File;
}

export default function FileUploader({ files, onFileAdd, onFileRemove, readOnly = false }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  // Función para manejar la selección de un nuevo archivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. El tamaño máximo es 10MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Generar un ID temporal único
      const tempId = `temp_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Leer el archivo como URL de datos para previsualización
      const dataUrl = await readFileAsDataURL(file);
      
      // Crear un objeto de archivo temporal
      const tempFile: TempFileItem = {
        id: tempId,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        dataUrl,
        file
      };
      
      // Llamar al callback para añadir el archivo
      onFileAdd(tempFile);
      
      // Limpiar el input
      e.target.value = '';
      toast.success('Archivo añadido');
      
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      toast.error('Error al procesar el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  // Función para leer un archivo como URL de datos
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Función para previsualizar un archivo
  const handlePreview = (file: TempFileItem) => {
    setPreviewFile(file.dataUrl);
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
              id="file-upload-new"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <label htmlFor="file-upload-new">
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
                      Procesando...
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
      
      {files.length > 0 ? (
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
                    src={file.dataUrl} 
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
                      onClick={() => onFileRemove(file.id)}
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
