import React from 'react';
import { useParams } from 'react-router-dom';
import DashboardFrame from '../DashboardFrame';
import AIInsightsDashboard from '../ai/AIInsightsDashboard';

export default function CaseOverviewPage() {
  const { caseId } = useParams();
  // Placeholder: in follow-up we will fetch composite endpoint
  return (
    <DashboardFrame title={`Case Overview`}> 
      <div className="space-y-6">
        <div className="text-sm opacity-80">Case ID: {caseId}</div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl border border-white/20 bg-white/5">Documents Summary (coming soon)</div>
          <div className="p-4 rounded-xl border border-white/20 bg-white/5 md:col-span-2">Timeline (coming soon)</div>
        </div>
        
        {/* AI Insights Section */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <AIInsightsDashboard caseId={caseId} />
          </div>
        </div>
      </div>
    </DashboardFrame>
  );
}
