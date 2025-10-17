import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DOC_TOPICS, TOTAL_DOCS } from './constants';
import UploadDialog from './UploadDialog';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/toast';
import { apiFetch } from '../../lib/apiClient';

// Map latest upload status to our traffic-light status
// returns { code: 'red' | 'yellow' | 'green', text }
function mapStatus(latest) {
  if (!latest) return { code: 'red', text: 'Not submitted' };
  if (latest.confirmed === true || latest.status === 'accepted' || latest.status === 'confirmed') {
    return { code: 'green', text: 'Accepted' };
  }
  if (latest.status === 'rejected') {
    return { code: 'yellow', text: 'Needs resubmission' };
  }
  return { code: 'yellow', text: 'Awaiting review' }; // pending / uploaded
}

function variantFor(code) {
  return code === 'green' ? 'success' : code === 'yellow' ? 'warning' : 'destructive';
}

function pickLatestUpload(uploads = []) {
  return [...uploads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
}

export default function DivorceeDocumentsPanel({ caseId, userId, role = 'divorcee', onMetricsChange }) {
  const [selectedTopicKey, setSelectedTopicKey] = useState(DOC_TOPICS[0]?.key);
  const [byDocKey, setByDocKey] = useState({}); // { [doc_key]: Upload[] }
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, docKey: '' });
  const toast = useToast();

  const fetchUploads = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      // API returns { caseId, uploads: [ ...with upload_audit... ] }
      const data = await apiFetch(`/api/cases/${encodeURIComponent(caseId)}/uploads`);
      // Filter to this user's uploads only for divorcee view
      const items = (Array.isArray(data?.uploads) ? data.uploads : []).filter((u) => !userId || String(u.user_id) === String(userId));
      const grouped = items.reduce((acc, u) => {
        const key = u.doc_type || u.doc_key;
        if (!acc[key]) acc[key] = [];
        acc[key].push(u);
        return acc;
      }, {});
      setByDocKey(grouped);
    } catch (e) {
      console.error('Failed to fetch uploads:', e);
    } finally {
      setLoading(false);
    }
  }, [caseId, userId]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  // Realtime subscription for uploads on this case (any user in case triggers refresh)
  useEffect(() => {
    if (!caseId) return;
    const channel = supabase
      .channel(`uploads-${caseId}-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'uploads', filter: `case_id=eq.${caseId}` }, () => {
        fetchUploads();
      })
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, [caseId, userId, fetchUploads]);

  const { topicStatuses, submittedCount } = useMemo(() => {
    // Helpers to classify
    const isAccepted = (u) => !!u && (u.confirmed === true || u.status === 'accepted' || u.status === 'confirmed');
    const isRejected = (u) => !!u && u.status === 'rejected';
    const isPending = (u) => !!u && !isAccepted(u) && !isRejected(u);
    const hasUpload = (u) => !!u;

    // Count a doc as submitted if latest is pending or accepted (NOT rejected)
    let submitted = 0;
    const tStatuses = {};
    for (const topic of DOC_TOPICS) {
      let greens = 0; // accepted count
      let any = false; // any upload in topic
      for (const d of topic.docs) {
        const latest = pickLatestUpload(byDocKey[d.key] || []);
        if (isPending(latest) || isAccepted(latest)) submitted += 1;
        if (isAccepted(latest)) greens += 1;
        if (hasUpload(latest)) any = true;
      }
      const code = greens === topic.docs.length ? 'green' : any ? 'yellow' : 'red';
      tStatuses[topic.key] = { code, greens, total: topic.docs.length, any };
    }
    return { topicStatuses: tStatuses, submittedCount: submitted };
  }, [byDocKey]);

  // Notify parent with scoreboard metrics
  useEffect(() => {
    onMetricsChange?.({ submittedCount, total: TOTAL_DOCS });
  }, [submittedCount, onMetricsChange]);

  const selectedTopic = useMemo(() => DOC_TOPICS.find((t) => t.key === selectedTopicKey) || DOC_TOPICS[0], [selectedTopicKey]);

  function formatRelativeTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = Math.max(0, Date.now() - d.getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  async function handleView(upload) {
    try {
      // Note: apiFetch expects JSON, so we need raw fetch for blob downloads
      // but we can still use the token from apiFetch's bound getter
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/uploads/${upload.id}/file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`Failed to fetch file (HTTP ${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      console.error('View file failed:', e);
      try { toast.show(e.message || 'Unable to open file', 'destructive'); } catch {}
    }
  }

  return (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
      {/* Left: Progress/topics list */}
  <Card className="flex flex-col rounded-2xl">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold tracking-wide">Progress</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pr-3 flex-1 flex flex-col">
          <div className="flex flex-col gap-0.5 overflow-auto">
            {DOC_TOPICS.map((t) => {
              const status = topicStatuses[t.key] || { code: 'red', greens: 0, total: t.docs.length };
              const code = status.code;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedTopicKey(t.key)}
                  className={`w-full flex items-center rounded-md px-2 py-1 text-left hover:bg-white/10 ${selectedTopicKey === t.key ? 'bg-white/10' : ''}`}
                >
                  <span className="text-[13px] leading-tight font-medium flex items-center gap-1.5 w-full">
                    <span className="truncate max-w-[88px] flex-shrink-0">{t.title}</span>
                    <span className="flex items-center gap-0.5 flex-shrink-0">
                      {(() => {
                        // Topic dots: 3 dots showing quick status
                        const total = status.total || t.docs.length;
                        const accepted = status.greens || 0;
                        const any = status.any || false;
                        const halfOrMore = accepted / total >= 0.5 && total > 0;
                        const all = accepted === total && total > 0;
                        const fill = (i) => {
                          // i: 0,1,2
                          if (i === 0) return any ? (all ? 'bg-green-500' : 'bg-blue-400') : 'bg-white/30';
                          if (i === 1) return halfOrMore ? (all ? 'bg-green-500' : 'bg-blue-400') : 'bg-white/30';
                          return all ? 'bg-green-500' : 'bg-white/30';
                        };
                        return [0,1,2].map((i) => (
                          <span key={i} className={`inline-block w-2 h-2 rounded-full ${fill(i)} border border-white/40`} />
                        ));
                      })()}
                    </span>
                    <span className="text-[11px] opacity-70 ml-1 tabular-nums flex-shrink-0">{status.greens}/{status.total}</span>
                    <span className="flex-1" />
                  </span>
                </button>
              );
            })}
            <div className="mt-1 text-[10px] opacity-60 flex items-center gap-2 pl-2 pr-2">
              <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-full bg-blue-400 border border-white/40" /> started</span>
              <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-full bg-green-500 border border-white/40" /> complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Documents for selected topic */}
  <Card className="flex flex-col rounded-2xl">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold tracking-wide">{selectedTopic.title} — Checklist</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col overflow-auto">
          {loading ? (
            <div className="text-sm opacity-80">Loading documents…</div>
          ) : (
          <div className="flex flex-col divide-y divide-white/10">
            {selectedTopic.docs.map((d) => {
              const latest = pickLatestUpload(byDocKey[d.key] || []);
              const accepted = latest && (latest.confirmed === true || latest.status === 'accepted' || latest.status === 'confirmed');
              const rejected = latest && latest.status === 'rejected';
              const pending = latest && !accepted && !rejected;
              return (
                <div key={d.key} className="flex items-center justify-between py-2.5">
                  <div className="pr-2">
                    <div className="text-[13px] leading-tight font-medium">{d.label}</div>
                    {latest && (
                      <div className="text-[10px] opacity-70 mt-0.5">Last submitted {formatRelativeTime(latest.created_at)}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base" aria-hidden>
                      {!latest ? '❌' : accepted ? '✅' : '⏳'}
                    </span>
                    {latest && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleView(latest)}>View</Button>
                    )}
                    {role === 'divorcee' && (
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setDialog({ open: true, docKey: d.key })}>
                        {latest ? 'Replace' : 'Upload'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>

      <UploadDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((prev) => ({ ...prev, open: o }))}
        docKey={dialog.docKey}
        caseId={caseId}
        userId={userId}
        onUploaded={fetchUploads}
      />
    </div>
  );
}
