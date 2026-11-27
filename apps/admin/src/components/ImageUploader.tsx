import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { adminFetch } from '../lib/api';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readLocalDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });
}

export function ImageUploader({
  label,
  value,
  onChange,
  required = false,
  recommendedSize,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  recommendedSize?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setFileSize(file.size);

    const localDims = await readLocalDimensions(file);
    if (localDims.width > 0) {
      setDimensions(localDims);
    }

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminFetch<{ url: string }>('/admin/uploads', {
        method: 'POST',
        body: fd,
      });
      onChange(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
          {label} {required && '*'}
        </label>
        {recommendedSize && (
          <span className="text-[11px] text-gray-500">Recommended: {recommendedSize}</span>
        )}
      </div>

      {value ? (
        <div className="inline-block border border-stone bg-stone/30 p-1.5">
          <div className="relative">
            <img
              src={value}
              alt={label}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth > 0) {
                  setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                }
              }}
              className="h-28 w-40 object-cover"
            />
            <button
              type="button"
              onClick={() => {
                onChange('');
                setDimensions(null);
                setFileSize(null);
              }}
              aria-label="Remove image"
              className="absolute -right-2 -top-2 rounded-full bg-charcoal p-1 text-ivory shadow hover:bg-terracotta"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {dimensions && dimensions.width > 0 && (
            <p className="mt-1.5 text-[11px] font-medium text-charcoal/80">
              {dimensions.width} &times; {dimensions.height} px
              {fileSize !== null ? ` • ${formatBytes(fileSize)}` : ''}
            </p>
          )}
        </div>
      ) : uploading && dimensions && dimensions.width > 0 ? (
        <p className="text-[11px] text-charcoal/70">
          Uploading {dimensions.width} &times; {dimensions.height} px
          {fileSize !== null ? ` (${formatBytes(fileSize)})` : ''}...
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 border border-charcoal bg-white px-3 py-1.5 text-xs font-medium hover:bg-stone/40">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading...' : 'Upload Image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <input
          type="url"
          value={value}
          required={required}
          onChange={(e) => {
            setFileSize(null);
            onChange(e.target.value);
          }}
          placeholder="or paste image URL (https://...)"
          className="min-w-0 flex-1 border border-gray-300 bg-white px-3 py-1.5 text-xs"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
