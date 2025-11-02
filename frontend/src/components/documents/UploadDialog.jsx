import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { useToast } from '../ui/toast';
import config from '../../config';
import { validateDocument, getHelpMessage } from '../../services/aiDocumentValidator';

const API_BASE_URL = config.api.baseUrl;

export default function UploadDialog({ open, onOpenChange, docKey, caseId, userId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [validationFeedback, setValidationFeedback] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const toast = useToast();

  const processFile = async (selectedFile) => {
    setFile(selectedFile);
    
    if (selectedFile && docKey) {
      // Validate the file and show encouraging feedback
      const validation = await validateDocument(selectedFile, docKey, caseId);
      setValidationFeedback(validation);
      
      // Show immediate feedback toast
      if (validation.isValid) {
        toast.show(validation.encouragement || '✅ Great! This file looks good!', 'success');
      } else {
        toast.show(validation.error || '⚠️ Please check this file', 'warning');
      }
    } else {
      setValidationFeedback(null);
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0] || null;
    await processFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file || !docKey) return;

    const form = new FormData();
    // Backend expects field name 'document' and 'doc_type'; userId is derived from token; case association handled separately
    form.append('document', file);
    form.append('doc_type', String(docKey));
    
    // Add case_id if provided
    if (caseId) {
      form.append('case_id', String(caseId));
    }

    setSubmitting(true);
    setUploadProgress(0);
    setUploadSpeed(0);

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      
      // Use XMLHttpRequest for upload progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track progress
        let startTime = Date.now();
        let lastLoaded = 0;
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percentComplete);
            
            // Calculate upload speed (bytes per second)
            const elapsed = (Date.now() - startTime) / 1000; // seconds
            const bytesPerSecond = e.loaded / elapsed;
            setUploadSpeed(bytesPerSecond);
            
            lastLoaded = e.loaded;
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            try {
              const err = JSON.parse(xhr.response);
              reject(new Error(err.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });
        
        xhr.open('POST', `${API_BASE_URL}/api/uploads/file`);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(form);
      });
      
      try { toast.show('File submitted — awaiting review'); } catch {}
      onUploaded?.();
      onOpenChange(false);
      setFile(null);
      setValidationFeedback(null);
      setUploadProgress(0);
      setUploadSpeed(0);
    } catch (err) {
      console.error('Upload failed:', err);
      try { toast.show(err.message || 'Upload failed', 'destructive'); } catch {}
      setUploadProgress(0);
      setUploadSpeed(0);
    } finally {
      setSubmitting(false);
    }
  };

  // Format bytes to human-readable size
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <div className="text-sm mb-1">Document: <span className="font-medium">{docKey}</span></div>
            
            {/* Drag and drop area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                isDragging 
                  ? 'border-teal-500 bg-teal-500/10' 
                  : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
              } ${submitting ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !submitting && document.getElementById('file-input')?.click()}
            >
              <input 
                id="file-input"
                type="file" 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                disabled={submitting}
              />
              
              <div className="text-center">
                {isDragging ? (
                  <div className="space-y-2">
                    <div className="text-4xl">📥</div>
                    <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
                      Drop file here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl">📄</div>
                    <p className="text-sm font-medium">
                      {file ? 'File selected - Drop another to replace' : 'Drop file here or click to browse'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Show file info when selected */}
            {file && !submitting && (
              <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{file.name}</span>
                  <span className="text-muted-foreground ml-2">{formatBytes(file.size)}</span>
                </div>
              </div>
            )}
            
            {/* Upload progress bar */}
            {submitting && (
              <div className="mt-3 space-y-2">
                <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                  </span>
                  <div className="flex items-center gap-2">
                    {uploadSpeed > 0 && uploadProgress < 100 && (
                      <span className="text-muted-foreground">
                        {formatBytes(uploadSpeed)}/s
                      </span>
                    )}
                    <span className="font-medium text-teal-600 dark:text-teal-400">
                      {uploadProgress}%
                    </span>
                  </div>
                </div>
                {file && (
                  <div className="text-xs text-muted-foreground">
                    {file.name} ({formatBytes(file.size)})
                  </div>
                )}
              </div>
            )}
            
            {/* Show validation feedback */}
            {validationFeedback && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                validationFeedback.isValid 
                  ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300' 
                  : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'
              }`}>
                <div className="font-medium mb-1">
                  {validationFeedback.isValid ? '✅ Looking good!' : '⚠️ Quick check'}
                </div>
                <div className="opacity-90">
                  {validationFeedback.encouragement || validationFeedback.error}
                </div>
                
                {/* Show tips if available */}
                {validationFeedback.tips && validationFeedback.tips.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    <div className="font-medium mb-1">💡 Quick Tips:</div>
                    <ul className="space-y-1 ml-4">
                      {validationFeedback.tips.slice(0, 2).map((tip, i) => (
                        <li key={i} className="text-xs opacity-80">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Show help message before file selection */}
            {!file && docKey && (
              <div className="mt-2 text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                {getHelpMessage(docKey, 'before')}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting || !file}>
              {submitting ? (uploadProgress < 100 ? `Uploading ${uploadProgress}%` : 'Processing...') : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
