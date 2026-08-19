import { useState, useRef } from 'react';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}

export default function ImageUpload({ value, onChange, label = 'Supporting Photo', hint }: ImageUploadProps) {
  const { isDark } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Upload to backend
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.data.imageUrl);
      setPreview(data.data.imageUrl);
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
      setPreview('');
      onChange('');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const clear = () => {
    setPreview('');
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {label && (
        <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-slate-300' : 'text-gray-700')}>
          {label}
        </label>
      )}

      {preview ? (
        /* Preview with remove button */
        <div className="relative rounded-2xl overflow-hidden border-2 border-green-400"
          style={{ height: '180px' }}>
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          {!uploading && (
            <button type="button" onClick={clear}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full
                flex items-center justify-center text-white shadow-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Drop zone */
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative rounded-2xl border-2 border-dashed cursor-pointer transition-all',
            'flex flex-col items-center justify-center gap-3 p-8',
            isDark
              ? 'border-slate-600 hover:border-green-500 bg-slate-700/50 hover:bg-slate-700'
              : 'border-gray-300 hover:border-green-400 bg-gray-50 hover:bg-green-50',
          )}>
          {uploading ? (
            <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          ) : (
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center',
              isDark ? 'bg-slate-600' : 'bg-green-100')}>
              <Upload className="w-6 h-6 text-green-500" />
            </div>
          )}
          <div className="text-center">
            <p className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-gray-700')}>
              {uploading ? 'Uploading...' : 'Click to choose image'}
            </p>
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-500' : 'text-gray-400')}>
              or drag & drop here
            </p>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-600' : 'text-gray-300')}>
              JPG, PNG, WEBP up to 10MB
            </p>
          </div>
        </div>
      )}

      {hint && (
        <p className={cn('text-xs mt-1.5', isDark ? 'text-slate-500' : 'text-gray-400')}>{hint}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
