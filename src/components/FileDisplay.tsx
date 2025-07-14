/**
 * FileDisplay Component
 * 
 * A reusable component that displays files in a consistent, user-friendly format.
 * It can show both image previews and document files with appropriate icons.
 * 
 * Features:
 * - Shows image previews for image files
 * - Shows file icons with names for documents
 * - Consistent black and green styling
 * - Optional remove functionality
 */

import { FileText, Image } from "lucide-react";

// Define the structure of file information we need to display
export interface FileInfo {
  name: string;      // The file name (e.g., "document.pdf")
  type: string;      // The MIME type (e.g., "application/pdf", "image/jpeg")
  preview?: string;  // Optional: URL for image preview
}

// Define what props this component accepts
interface FileDisplayProps {
  files: FileInfo[];                                    // Array of files to display
  showRemoveButton?: boolean;                          // Whether to show remove buttons
  onRemove?: (index: number) => void;                  // Callback when user removes a file
}

/**
 * FileDisplay Component
 * 
 * Renders a list of files with appropriate visual representation.
 * Images show as previews, other files show as cards with icons.
 */
const FileDisplay = ({ files, showRemoveButton = false, onRemove }: FileDisplayProps) => {
  
  /**
   * Determines which icon to show based on file type
   * @param fileType - The MIME type of the file
   * @returns The appropriate Lucide icon component
   */
  const getFileIcon = (fileType: string) => {
    // If it's an image file, show image icon
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    // For all other files, show generic file icon
    return <FileText className="w-4 h-4" />;
  };

  /**
   * Extracts and formats the file extension for display
   * @param fileName - The full filename
   * @returns The file extension in uppercase (e.g., "PDF", "DOCX")
   */
  const getFileTypeLabel = (fileName: string) => {
    // Split by dots and get the last part (extension)
    const extension = fileName.split('.').pop()?.toUpperCase();
    return extension || 'FILE'; // Fallback if no extension found
  };

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {/* Loop through each file and render it */}
      {files.map((file, index) => (
        <div key={index} className="relative">
          {/* Check if file has a preview (image files) */}
          {file.preview ? (
            // Show image preview for image files
            <img 
              src={file.preview} 
              alt={file.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            // Show file card for non-image files
            <div className="flex items-center gap-3 bg-black text-white rounded-lg p-3 min-w-[180px]">
              {/* Icon container with green background */}
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
              
              {/* File information */}
              <div className="flex-1 min-w-0">
                {/* File name (truncated if too long) */}
                <div className="text-sm font-medium truncate">
                  {file.name}
                </div>
                {/* File type label */}
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