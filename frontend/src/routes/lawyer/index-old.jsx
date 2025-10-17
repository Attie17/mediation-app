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

export default function LawyerDashboard() {
  return (
    <DashboardFrame title="Lawyer Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Client Cases">
          <div className="text-sm opacity-80">No client cases yet.</div>
        </SectionCard>
        <SectionCard title="Required Docs & Access">
          <div className="text-sm opacity-80">Nothing needed at this time.</div>
        </SectionCard>
        <SectionCard title="Timeline & Notices">
          <div className="text-sm opacity-80">No milestones yet.</div>
        </SectionCard>
        <SectionCard title="Communication">
          <div className="text-sm opacity-80">You can contact the mediator when cases appear.</div>
        </SectionCard>
      </div>
    </DashboardFrame>
  );
}
