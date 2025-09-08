import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Upload, FileAudio, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  uploadedFile?: File | null;
}

export function UploadDropzone({ onFileSelected, uploadedFile }: UploadDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0]);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
      'video/*': ['.mp4', '.mov', '.avi']
    },
    multiple: false
  });

  return (
    <Card 
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed cursor-pointer transition-all duration-200 hover:shadow-medium",
        isDragActive ? "border-primary bg-primary/5" : "border-border",
        uploadedFile ? "border-medical-success bg-medical-success/5" : ""
      )}
    >
      <input
        {...getInputProps()}
        type="file"
        accept="audio/*,video/*"
        onChange={e => {
          const f = e.target.files?.[0] || null;
          if (f) onFileSelected(f);
        }}
      />
      <div className="p-8 text-center space-y-4">
        {uploadedFile ? (
          <>
            <CheckCircle className="h-12 w-12 text-medical-success mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-foreground">File Ready</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {uploadedFile.name} ({Math.round(uploadedFile.size / 1024 / 1024 * 100) / 100} MB)
              </p>
            </div>
          </>
        ) : (
          <>
            {isDragActive ? (
              <Upload className="h-12 w-12 text-primary mx-auto animate-bounce" />
            ) : (
              <FileAudio className="h-12 w-12 text-muted-foreground mx-auto" />
            )}
            <div>
              <h3 className="text-lg font-medium text-foreground">
                {isDragActive ? "Drop your file here" : "Upload Audio or Video"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports MP3, WAV, M4A, AAC, MP4, MOV, AVI
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}