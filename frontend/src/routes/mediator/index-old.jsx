import React from 'react';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

function SectionCard({ title, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function MediatorDashboard() {
  return (
    <DashboardFrame title="Mediator Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Today at a glance">
          <div className="text-sm opacity-80">No sessions scheduled for today.</div>
        </SectionCard>
        <SectionCard title="Assigned Cases">
          <div className="text-sm opacity-80">No assigned cases yet.</div>
        </SectionCard>
        <SectionCard title="Action Queues: Needs Review">
          <div className="text-sm opacity-80">No uploads awaiting review.</div>
        </SectionCard>
        <SectionCard title="Action Queues: Pending Invitations">
          <div className="text-sm opacity-80">No pending invitations.</div>
        </SectionCard>
        <SectionCard title="Case Tools">
          <div className="flex flex-wrap gap-2 text-sm">
            <button className="rounded-full bg-white text-blue-700 font-semibold px-4 py-1">Invite Participants</button>
            <button className="rounded-full bg-white text-blue-700 font-semibold px-4 py-1">Update Phase</button>
            <button className="rounded-full bg-white text-blue-700 font-semibold px-4 py-1">Draft/Export Report</button>
          </div>
        </SectionCard>
        <SectionCard title="Notifications Feed">
          <div className="text-sm opacity-80">Nothing new right now.</div>
        </SectionCard>
      </div>
    </DashboardFrame>
  );
}
