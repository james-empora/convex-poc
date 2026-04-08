"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFileSize } from "@/lib/portal/fake-data";

interface PortalDocumentUploadProps {
  onUpload: (file: File) => void;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/tiff",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export function PortalDocumentUpload({ onUpload }: PortalDocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateAndSet = useCallback((file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported file type. Please upload a PDF, image, DOCX, or XLSX file.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File is too large. Maximum size is 50 MB.");
      return;
    }
    setSelectedFile(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSet(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  }

  function handleUpload() {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
    }
  }

  return (
    <Card
      className={
        dragOver
          ? "border-2 border-dashed border-sapphire-40 bg-sapphire-10/50"
          : "border-2 border-dashed border-onyx-20"
      }
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <CardContent className="p-4">
        {selectedFile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-sapphire-60" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-onyx-100">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-onyx-50">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-onyx-50 hover:bg-onyx-10 hover:text-onyx-80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={handleUpload} className="w-full" size="sm">
              Upload Document
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 py-4 text-center"
          >
            <Upload className="h-6 w-6 text-onyx-40" />
            <span className="text-sm font-medium text-onyx-70">
              Upload a document
            </span>
            <span className="text-xs text-onyx-40">
              Drag & drop or tap to browse
            </span>
          </button>
        )}

        {error && (
          <p className="mt-2 text-xs text-danger-80">{error}</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.docx,.xlsx"
          className="hidden"
          onChange={handleFileChange}
        />
      </CardContent>
    </Card>
  );
}
