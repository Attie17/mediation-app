import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Database, Cpu, HardDrive, Network, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';

export default function SystemHealthPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/admin')}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              bg-slate-800/50 border border-slate-700
              text-slate-300 hover:text-teal-400
              hover:border-teal-500/50
              transition-all duration-200
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">System Health</h1>
            <p className="text-slate-400">Monitor system performance and status</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card gradient hover>
            <CardDecoration color="teal" />
            <CardHeader icon={<Cpu className="w-5 h-5 text-teal-400" />}>
              <CardTitle>API Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <MetricRow label="Response Time" value="245ms" status="good" />
                <MetricRow label="Requests/min" value="1,247" status="good" />
                <MetricRow label="Success Rate" value="99.8%" status="good" />
                <MetricRow label="Error Rate" value="0.02%" status="good" />
              </div>
            </CardContent>
          </Card>

          <Card gradient hover>
            <CardDecoration color="blue" />
            <CardHeader icon={<Database className="w-5 h-5 text-blue-400" />}>
              <CardTitle>Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <MetricRow label="Connections" value="12/100" status="good" />
                <MetricRow label="Query Time" value="18ms" status="good" />
                <MetricRow label="Cache Hit Rate" value="94.2%" status="good" />
                <MetricRow label="Storage Used" value="2.4 GB" status="good" />
              </div>
            </CardContent>
          </Card>

          <Card gradient hover>
            <CardDecoration color="purple" />
            <CardHeader icon={<HardDrive className="w-5 h-5 text-purple-400" />}>
              <CardTitle>Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <MetricRow label="Total Space" value="50 GB" status="good" />
                <MetricRow label="Used Space" value="2.4 GB" status="good" />
                <MetricRow label="Available" value="47.6 GB" status="good" />
                <MetricRow label="Usage" value="4.8%" status="good" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, status }) {
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400'
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-medium ${statusColors[status]}`}>{value}</span>
    </div>
  );
}
