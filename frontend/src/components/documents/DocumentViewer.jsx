/**
 * Document Viewer Component
 * Provides in-app preview for documents (PDF, images, etc.)
 * with zoom controls, pagination, and download functionality
 */

import React, { useState } from 'react';
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

/**
 * DocumentViewer Component
 * 
 * @param {Object} props
 * @param {string} props.fileUrl - URL of the document to display
 * @param {string} props.fileName - Name of the file
 * @param {string} props.fileType - MIME type or file extension
 * @param {Function} props.onClose - Callback when viewer is closed (for modal mode)
 * @param {boolean} props.embedded - Whether to show in embedded mode (vs full modal)
 */
export default function DocumentViewer({ 
  fileUrl, 
  fileName = 'document', 
  fileType = '', 
  onClose,
  embedded = false 
}) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determine file type from extension or MIME type
  const getFileCategory = () => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    const mime = fileType?.toLowerCase() || '';
    
    if (ext === 'pdf' || mime.includes('pdf')) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mime.includes('image')) return 'image';
    if (['doc', 'docx', 'odt'].includes(ext) || mime.includes('word')) return 'document';
    if (['xls', 'xlsx', 'ods'].includes(ext) || mime.includes('spreadsheet')) return 'spreadsheet';
    return 'unknown';
  };

  const fileCategory = getFileCategory();

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handlePreviousPage = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage(prev => Math.min(prev + 1, totalPages));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderControls = () => (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-white/10">
      <div className="flex items-center gap-4">
        {/* File Info */}
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          <div>
            <div className="text-sm font-medium text-white truncate max-w-xs">
              {fileName}
            </div>
            <div className="text-xs text-slate-500">
              {fileCategory.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Zoom Controls (for images and PDFs) */}
        {(fileCategory === 'pdf' || fileCategory === 'image') && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-1 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-slate-300" />
            </button>
            <span className="px-2 text-sm text-slate-300 min-w-[3rem] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-1 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        )}

        {/* Page Navigation (for PDFs) */}
        {fileCategory === 'pdf' && totalPages > 1 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700">
            <button
              onClick={handlePreviousPage}
              disabled={page <= 1}
              className="p-1 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
            <span className="px-2 text-sm text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className="p-1 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 transition-colors text-sm"
          title="Download Document"
        >
          <Download className="w-4 h-4" />
          Download
        </button>

        {/* Close Button (modal mode only) */}
        {!embedded && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    // Error state
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Document</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 transition-colors"
          >
            Download Instead
          </button>
        </div>
      );
    }

    // Loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500/30 border-t-teal-500 mb-4"></div>
            <p className="text-slate-400">Loading document...</p>
          </div>
        </div>
      );
    }

    // Render based on file type
    switch (fileCategory) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full overflow-auto p-4">
            <img
              src={fileUrl}
              alt={fileName}
              style={{ transform: `scale(${zoom / 100})` }}
              className="max-w-full h-auto transition-transform"
              onLoad={() => setLoading(false)}
              onError={(e) => {
                setError('Failed to load image');
                setLoading(false);
              }}
            />
          </div>
        );

      case 'pdf':
        // For now, use iframe as a simple PDF viewer
        // In production, consider using react-pdf or pdf.js for better control
        return (
          <div className="h-full">
            <iframe
              src={`${fileUrl}#page=${page}&zoom=${zoom}`}
              className="w-full h-full border-none"
              title={fileName}
              onLoad={() => {
                setLoading(false);
                // Note: Getting PDF page count from iframe is complex
                // For now, assume single page or use server-side metadata
              }}
              onError={() => {
                setError('Failed to load PDF. Your browser may not support PDF viewing.');
                setLoading(false);
              }}
            />
          </div>
        );

      case 'document':
      case 'spreadsheet':
        // Microsoft Office or Google Docs viewer
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
        return (
          <div className="h-full">
            <iframe
              src={viewerUrl}
              className="w-full h-full border-none"
              title={fileName}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Failed to load document preview');
                setLoading(false);
              }}
            />
          </div>
        );

      default:
        // Unsupported file type
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FileText className="w-16 h-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Preview Not Available</h3>
            <p className="text-slate-400 mb-4">
              This file type cannot be previewed in the browser.
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download to View
            </button>
          </div>
        );
    }
  };

  // Render as modal or embedded
  const content = (
    <div className={`flex flex-col ${embedded ? 'h-full' : 'fixed inset-0 z-50 bg-slate-900'}`}>
      {renderControls()}
      <div className={`flex-1 ${embedded ? '' : 'overflow-hidden'}`}>
        {renderContent()}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  // Modal mode with backdrop
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="w-full h-full max-w-7xl max-h-screen m-4 bg-slate-900 rounded-lg overflow-hidden shadow-2xl">
        {content}
      </div>
    </div>
  );
}

/**
 * Simple embedded PDF viewer using iframe
 * Use this for quick integration without additional libraries
 */
export function SimplePDFViewer({ url, className = '' }) {
  return (
    <div className={`w-full h-full min-h-[600px] ${className}`}>
      <iframe
        src={url}
        className="w-full h-full border-0 rounded-lg"
        title="PDF Document"
      />
    </div>
  );
}

/**
 * Image viewer with zoom
 */
export function ImageViewer({ url, alt = 'Document', className = '' }) {
  const [zoom, setZoom] = useState(100);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={() => setZoom(prev => Math.max(prev - 25, 50))}
          className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="px-3 py-2 rounded-lg bg-slate-800/90 text-white text-sm">
          {zoom}%
        </span>
        <button
          onClick={() => setZoom(prev => Math.min(prev + 25, 200))}
          className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-auto h-full flex items-center justify-center p-4">
        <img
          src={url}
          alt={alt}
          style={{ transform: `scale(${zoom / 100})` }}
          className="max-w-full h-auto transition-transform"
        />
      </div>
    </div>
  );
}
