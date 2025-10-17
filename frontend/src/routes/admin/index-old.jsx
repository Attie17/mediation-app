import React from 'react';
import { Link } from 'react-router-dom';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

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

export default function AdminDashboard() {
  return (
    <DashboardFrame title="Admin Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="User & Role Management">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/admin/roles"><Button size="sm">Manage roles</Button></Link>
            <Button size="sm" variant="outline">Invite user</Button>
          </div>
        </SectionCard>
        <SectionCard title="System Overview">
          <div className="text-sm opacity-80">KPIs will appear here.</div>
        </SectionCard>
        <SectionCard title="Policies & Config">
          <div className="text-sm opacity-80">Feature toggles coming soon.</div>
        </SectionCard>
        <SectionCard title="Audit & Logs">
          <div className="text-sm opacity-80">No data yet—connect the system or invite users.</div>
        </SectionCard>
        <SectionCard title="Health Checks">
          <div className="text-sm opacity-80">Backend/DB health will appear here.</div>
        </SectionCard>
      </div>
    </DashboardFrame>
  );
}
