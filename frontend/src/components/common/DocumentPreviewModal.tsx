import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
   X, Download, Maximize2, Minimize2, ZoomIn, ZoomOut, 
   RotateCw, FileText, AlertCircle, Loader2, ExternalLink 
} from 'lucide-react';
import { api, extractErrorMessage } from '../../services/api';
import { Button } from './Button';
import { Badge } from './Badge';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  previewUrl: string; // e.g. /resources/12/download?preview=true or /assignments/submissions/5/download?preview=true
  downloadUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  similarityScore?: number;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  previewUrl,
  downloadUrl,
  fileName,
  fileSize,
  similarityScore,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
  const isCodeOrText = ['txt', 'csv', 'py', 'cpp', 'c', 'java', 'js', 'ts', 'jsx', 'tsx', 'json', 'md', 'html', 'css'].includes(ext);

  useEffect(() => {
    let currentBlobUrl: string | null = null;

    const loadPreview = async () => {
      if (!isOpen) return;
      setIsLoading(true);
      setErrorMsg(null);
      setTextContent(null);
      setZoom(100);
      setRotation(0);

      try {
        const response = await api.get(previewUrl, {
          responseType: isCodeOrText ? 'text' : 'blob',
        });

        if (isCodeOrText) {
          setTextContent(typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
        } else {
          const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
          currentBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(currentBlobUrl);
        }
      } catch (err: any) {
        const msg = await extractErrorMessage(err, 'Failed to stream document preview');
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [isOpen, previewUrl, isCodeOrText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const res = await api.get(downloadUrl, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(downloadUrl, '_blank');
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[999999] flex flex-col bg-slate-950/80 backdrop-blur-md transition-all ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4 lg:p-6'
      }`}
    >
      {/* Viewer Main Container Card */}
      <div className={`relative flex flex-col w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in-up ${
        isFullscreen ? 'rounded-0' : 'rounded-2xl max-w-[1400px] mx-auto'
      }`}>
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md flex-shrink-0 gap-3">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/80 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {title}
                </h3>
                {similarityScore !== undefined && (
                  <Badge 
                    variant={similarityScore > 50 ? 'rose' : similarityScore > 25 ? 'amber' : 'emerald'} 
                    size="xs"
                    dot
                  >
                    {similarityScore}% Similarity
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {fileName} {fileSize ? `• ${(fileSize / (1024 * 1024)).toFixed(2)} MB` : ''} {subtitle ? `• ${subtitle}` : ''}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {isImage && (
              <>
                <button
                  onClick={() => setZoom(z => Math.max(z - 25, 50))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(z + 25, 300))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </>
            )}

            <Button
              variant="saffron"
              size="xs"
              onClick={handleDownload}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download
            </Button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content Body */}
        <div className="flex-1 bg-slate-100/70 dark:bg-slate-950 flex items-center justify-center overflow-auto p-4 relative">
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Streaming secure document preview...
              </p>
            </div>
          )}

          {errorMsg && !isLoading && (
            <div className="text-center max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unable to Preview In-Browser</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">{errorMsg}</p>
              <Button variant="saffron" size="sm" onClick={handleDownload} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Download File Directly
              </Button>
            </div>
          )}

          {!isLoading && !errorMsg && (
            <>
              {/* 1. PDF Document Embedded Viewer */}
              {isPdf && blobUrl && (
                <iframe
                  src={`${blobUrl}#toolbar=1&navpanes=0`}
                  title={fileName}
                  className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white"
                />
              )}

              {/* 2. Image Viewer */}
              {isImage && blobUrl && (
                <div className="flex items-center justify-center w-full h-full overflow-auto">
                  <img
                    src={blobUrl}
                    alt={fileName}
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-md select-none"
                  />
                </div>
              )}

              {/* 3. Text and Source Code Viewer */}
              {isCodeOrText && textContent !== null && (
                <div className="w-full h-full overflow-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre select-text shadow-xs">
                  {textContent}
                </div>
              )}

              {/* 4. Other formats (Office docs, zip) */}
              {!isPdf && !isImage && !isCodeOrText && (
                <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Binary Document Format (.${ext})</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                    This file format is optimized for dedicated desktop applications (e.g. Word, PowerPoint, Excel).
                  </p>
                  <Button variant="saffron" size="sm" onClick={handleDownload} leftIcon={<Download className="w-3.5 h-3.5" />}>
                    Download & Open ({fileName})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
