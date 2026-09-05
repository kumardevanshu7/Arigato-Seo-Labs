import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, Sparkles, Check, RefreshCw } from 'lucide-react';

interface ImageDropzoneProps {
  imagePreview: string | null;
  onImageSelected: (dataUrl: string, fileName: string) => void;
  onImageRemoved: () => void;
  isScanning?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  imagePreview,
  onImageSelected,
  onImageRemoved,
  isScanning = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string; dimensions?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle clipboard paste of image
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          processFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImageMeta({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          dimensions: `${img.naturalWidth} × ${img.naturalHeight}px`,
        });
      };
      img.src = dataUrl;
      onImageSelected(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
      />

      {!imagePreview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer border-2 border-dashed rounded-lg p-5 sm:p-7 text-center transition-all duration-200 ${
            isDragOver
              ? 'border-[#5645d4] bg-[#e6e0f5]/30 shadow-inner'
              : 'border-[#c8c4be] hover:border-[#5645d4] bg-[#fafaf9] hover:bg-[#f6f5f4]'
          }`}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2.5 rounded-full bg-white border border-[#e5e3df] flex items-center justify-center text-[#5645d4] shadow-xs group-hover:scale-110 transition-transform">
            <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1">
            Tap to upload artwork or drag & drop
          </p>
          <p className="text-[11px] text-[#787671] mb-3">
            PNG, JPG, WEBP • <span className="hidden sm:inline"><kbd className="px-1 py-0.5 bg-[#e5e3df] rounded text-[9px] font-mono">Ctrl+V</kbd> paste supported</span>
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#c8c4be] text-xs font-semibold text-[#37352f] rounded-md shadow-2xs group-hover:border-[#5645d4] transition-colors">
            <ImageIcon className="w-3.5 h-3.5 text-[#787671]" />
            <span>Select Artwork Image</span>
          </div>
        </div>
      ) : (
        <div className="relative bg-white border border-[#e5e3df] rounded-lg p-3 shadow-xs overflow-hidden">
          {/* Scanning Laser Animation Overlay */}
          {isScanning && (
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-lg">
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff64c8] to-[#5645d4] shadow-[0_0_15px_#5645d4] animate-scan"></div>
              <div className="absolute inset-0 bg-[#5645d4]/10 backdrop-blur-[0.5px]"></div>
              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[#0a1530]/95 text-white text-[11px] px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-[#f5d75e] animate-spin shrink-0" />
                <span className="truncate">Scanning visual composition & aesthetics...</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            {/* Image Preview Box */}
            <div className="relative w-full sm:w-40 h-44 sm:h-40 rounded-md overflow-hidden bg-[#f6f5f4] border border-[#e5e3df] flex items-center justify-center shrink-0">
              <img
                src={imagePreview}
                alt="Selected reference"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-[#0a1530]/85 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs">
                Visual Context
              </span>
              <button
                onClick={onImageRemoved}
                disabled={isScanning}
                className="sm:hidden absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Image Details */}
            <div className="flex-1 w-full text-left flex flex-col justify-between py-1">
              <div>
                <div className="hidden sm:flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#1aae39] shrink-0"></span>
                    <span className="text-xs font-semibold text-[#1a1a1a] truncate">
                      {imageMeta?.name || 'Uploaded Artwork'}
                    </span>
                  </div>
                  <button
                    onClick={onImageRemoved}
                    disabled={isScanning}
                    className="p-1 hover:bg-[#f6f5f4] text-[#787671] hover:text-[#e03131] rounded transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 my-1 sm:my-2 text-xs">
                  <div className="bg-[#f6f5f4] p-2 rounded border border-[#ede9e4]">
                    <span className="text-[10px] text-[#787671] block">Size</span>
                    <span className="font-medium text-[#37352f] text-[11px] truncate block">
                      {imageMeta?.size || 'Direct stream'}
                    </span>
                  </div>
                  <div className="bg-[#f6f5f4] p-2 rounded border border-[#ede9e4]">
                    <span className="text-[10px] text-[#787671] block">Dimensions</span>
                    <span className="font-medium text-[#37352f] text-[11px] truncate block">
                      {imageMeta?.dimensions || 'Auto'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#5d5b54] bg-[#d9f3e1]/40 border border-[#d9f3e1] p-1.5 sm:p-2 rounded flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#1aae39] shrink-0" />
                  <span>Ready for aesthetic & prompt indexing.</span>
                </div>
              </div>

              {/* Replace Button */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#ede9e4] mt-2">
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-[#5645d4] hover:text-[#4534b3] font-medium px-2 py-1.5 rounded hover:bg-[#e6e0f5]/30 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace Artwork</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
