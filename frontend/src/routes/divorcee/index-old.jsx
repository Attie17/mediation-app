import React from 'react';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import ChatDrawer from '../../components/chat/ChatDrawer';
import { useAuth } from '../../context/AuthContext';
import DivorceeDocumentsPanel from '../../components/documents/DivorceeDocumentsPanel';

function SectionCard({ title, children }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center text-center">
        {children}
      </CardContent>
    </Card>
  );
}

export default function DivorceeDashboard() {
  const { user } = useAuth();
    const [chatOpen, setChatOpen] = React.useState(false);
  const [score, setScore] = React.useState({ submittedCount: 0, total: 16 });
  // Assumptions: we'll read caseId from localStorage if set by intake; otherwise use 4 as a demo ID
  const caseId = Number(localStorage.getItem('activeCaseId')) || 4;
  const userId = user?.id || '11111111-1111-1111-1111-111111111111';
  return (
    <DashboardFrame title="Divorcee Dashboard">
      {/* Scoreboard under the page title */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="text-sm">Progress: ({score.submittedCount}/{score.total})</div>
          <div className="w-1/2 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-2 bg-white rounded-full" style={{ width: `${Math.min(100, Math.round((score.submittedCount / score.total) * 100))}%` }} />
          </div>
        </div>
      </div>
      <div className="flex justify-end mb-3">
  <ChatDrawer open={chatOpen} onOpenChange={setChatOpen} />
      </div>
      {/* Main two-card row */}
      <div className="flex flex-col gap-8">
        <DivorceeDocumentsPanel caseId={caseId} userId={userId} role={user?.role || 'divorcee'} onMetricsChange={setScore} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px]">
            <div className="text-center text-sm opacity-80">
              <div className="font-semibold mb-1">Upcoming Event</div>
              Schedule will appear here.
            </div>
          </Card>
          <Card className="rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px]">
            <div className="text-center text-sm opacity-80">
              <div className="font-semibold mb-1">Case Overview</div>
              Recent activity will appear here.
            </div>
          </Card>
        </div>
        {/* Support Links full-width card */}
        <Card className="rounded-2xl p-6 flex flex-col">
          <div className="mb-4 text-center font-semibold tracking-wide text-sm uppercase opacity-90">Support Links</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button className="w-full rounded-full bg-white text-blue-700 font-semibold border border-white/60 hover:bg-white/80 shadow-sm">What to expect</Button>
            <Button className="w-full rounded-full bg-white text-blue-700 font-semibold border border-white/60 hover:bg-white/80 shadow-sm">Privacy</Button>
            <Button className="w-full rounded-full bg-white text-blue-700 font-semibold border border-white/60 hover:bg-white/80 shadow-sm">Contact mediator</Button>
            <Button className="w-full rounded-full bg-white text-blue-700 font-semibold border border-white/60 hover:bg-white/80 shadow-sm" onClick={() => setChatOpen(true)}>Group chat</Button>
          </div>
        </Card>
      </div>
    </DashboardFrame>
  );
}
