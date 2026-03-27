import React from "react";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  file,
  onFileSelect,
  onFileRemove,
  accept = ".pdf,.docx,.png,.jpg",
  maxSizeMB = 10,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && !disabled) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={`flex items-center justify-center w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {file ? (
        <div className="flex items-center justify-between w-full p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-3 overflow-hidden">
            <FileText className="h-8 w-8 text-blue-500 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </span>
              <span className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </span>
            </div>
          </div>
          <button
            onClick={onFileRemove}
            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 hover:text-red-500" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-gray-400" />
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500">
              {accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")} (MAX. {maxSizeMB}MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleChange}
          />
        </label>
      )}
    </div>
  );
};

export default FileUpload;
