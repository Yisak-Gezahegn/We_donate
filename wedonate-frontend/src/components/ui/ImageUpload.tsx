import { useState, useRef } from 'react';
import { Upload, X, Image, FileText, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  accept?: string;
}

export default function ImageUpload({ value, onChange, label = 'Supporting Photo', hint, accept = 'image/*' }: ImageUploadProps) {
  const { isDark } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const isPdf = accept === 'application/pdf' || (accept.includes('pdf') && !accept.includes('image'));

  const handleFile = async (file: File) => {
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    if (!isPdf) setPreview(localUrl);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.data.imageUrl);
      if (isPdf) setPreview(data.data.imageUrl);
      else setPreview(data.data.imageUrl);
      toast.success(isPdf ? 'Document uploaded' : 'Image uploaded');
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
    if (!file) return;
    if (isPdf && file.type === 'application/pdf') handleFile(file);
    else if (!isPdf && file.type.startsWith('image/')) handleFile(file);
  };

  const clear = () => {
    setPreview('');
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const hasPreview = preview && (!isPdf || preview.endsWith('.pdf'));

  return (
    <div className="w-full">
      {hasPreview ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-green-400" style={{ height: '140px' }}>
          {isPdf ? (
            <div className={cn('w-full h-full flex items-center justify-center gap-3',
              isDark ? 'bg-slate-700' : 'bg-gray-100')}>
              <FileText className="w-10 h-10 text-green-500" />
              <div className="text-left">
                <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Document uploaded</p>
                <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>Registration certificate</p>
              </div>
            </div>
          ) : (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          )}
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
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative rounded-2xl border-2 border-dashed cursor-pointer transition-all',
            'flex flex-col items-center justify-center gap-3 p-6',
            isDark
              ? 'border-slate-600 hover:border-green-500 bg-slate-700/50 hover:bg-slate-700'
              : 'border-gray-300 hover:border-green-400 bg-gray-50 hover:bg-green-50',
          )}>
          {uploading ? (
            <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          ) : (
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center',
              isDark ? 'bg-slate-600' : 'bg-green-100')}>
              {isPdf ? <FileText className="w-6 h-6 text-green-500" /> : <Upload className="w-6 h-6 text-green-500" />}
            </div>
          )}
          <div className="text-center">
            <p className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-gray-700')}>
              {uploading ? 'Uploading...' : isPdf ? 'Click to upload PDF' : 'Click to choose image'}
            </p>
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-500' : 'text-gray-400')}>
              or drag & drop here
            </p>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-600' : 'text-gray-300')}>
              {isPdf ? 'PDF up to 10MB' : 'JPG, PNG, WEBP up to 10MB'}
            </p>
          </div>
        </div>
      )}

      {hint && (
        <p className={cn('text-xs mt-1.5', isDark ? 'text-slate-500' : 'text-gray-400')}>{hint}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
