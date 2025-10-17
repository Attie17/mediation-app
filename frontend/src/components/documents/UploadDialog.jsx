import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { useToast } from '../ui/toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function UploadDialog({ open, onOpenChange, docKey, caseId, userId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();
  if (!file || !docKey) return;

    const form = new FormData();
  // Backend expects field name 'document' and 'doc_type'; userId is derived from token; case association handled separately
  form.append('document', file);
  form.append('doc_type', String(docKey));

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/uploads/file`, {
        method: 'POST',
        headers: localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : undefined,
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed (${res.status})`);
      }
      try { toast.show('File submitted — awaiting review'); } catch {}
      onUploaded?.();
      onOpenChange(false);
      setFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
      try { toast.show(err.message || 'Upload failed', 'destructive'); } catch {}
    } finally {
      setSubmitting(false);
    }
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
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full" />
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={submitting || !file}>{submitting ? 'Uploading…' : 'Submit'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
