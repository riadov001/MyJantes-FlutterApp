import { useState } from "react";
import type { ReactNode } from "react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string }> }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length > maxNumberOfFiles) {
      alert(`Vous ne pouvez télécharger que ${maxNumberOfFiles} fichier(s) maximum.`);
      return;
    }

    setIsUploading(true);
    const uploadResults: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > maxFileSize) {
          alert(`Le fichier ${file.name} dépasse la taille limite de ${Math.round(maxFileSize / 1024 / 1024)}MB.`);
          continue;
        }

        // Get upload URL
        const { url } = await onGetUploadParameters();

        // Upload file
        const response = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (response.ok) {
          uploadResults.push(url.split('?')[0]); // Remove query parameters
        } else {
          throw new Error(`Upload failed for ${file.name}`);
        }
      }

      setUploadedFiles(prev => [...prev, ...uploadResults]);
      
      if (onComplete) {
        onComplete({
          successful: uploadResults.map(url => ({ uploadURL: url }))
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Erreur lors du téléchargement des fichiers.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div>
      <label className={`cursor-pointer ${buttonClassName || ''}`}>
        <input
          type="file"
          multiple={maxNumberOfFiles > 1}
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
        <div className={`inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {isUploading ? 'Téléchargement...' : children}
        </div>
      </label>
      
      {uploadedFiles.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-green-600">
            {uploadedFiles.length} fichier(s) téléchargé(s) avec succès
          </p>
        </div>
      )}
    </div>
  );
}