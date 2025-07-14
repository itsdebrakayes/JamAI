import { FileText, Image } from "lucide-react";

export interface FileInfo {
  name: string;
  type: string;
  preview?: string;
}

interface FileDisplayProps {
  files: FileInfo[];
  showRemoveButton?: boolean;
  onRemove?: (index: number) => void;
}

const FileDisplay = ({ files, showRemoveButton = false, onRemove }: FileDisplayProps) => {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getFileTypeLabel = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
  };

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {files.map((file, index) => (
        <div key={index} className="relative">
          {file.preview ? (
            // Image preview
            <img 
              src={file.preview} 
              alt={file.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            // File display
            <div className="flex items-center gap-3 bg-black text-white rounded-lg p-3 min-w-[180px]">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {file.name}
                </div>
                <div className="text-xs text-gray-300">
                  {getFileTypeLabel(file.name)}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FileDisplay;