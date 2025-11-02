import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Users, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration, CardDescription } from '../../components/ui/card-enhanced';

export default function RolesPermissionsPage() {
  const navigate = useNavigate();

  const roles = [
    {
      name: 'Admin',
      color: 'purple',
      icon: Shield,
      permissions: ['Full system access', 'User management', 'Case oversight', 'System configuration']
    },
    {
      name: 'Mediator',
      color: 'teal',
      icon: Users,
      permissions: ['Case management', 'Schedule sessions', 'Document review', 'Participant communication']
    },
    {
      name: 'Lawyer',
      color: 'orange',
      icon: FileText,
      permissions: ['Client case access', 'Document review', 'Case communication', 'Legal advice']
    },
    {
      name: 'Divorcee',
      color: 'blue',
      icon: Users,
      permissions: ['Own case access', 'Document upload', 'Session participation', 'Message mediator']
    }
  ];

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
            <h1 className="text-3xl font-bold text-white">Roles & Permissions</h1>
            <p className="text-slate-400">Configure user roles and access levels</p>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card key={role.name} gradient hover>
              <CardDecoration color={role.color} />
              <CardHeader icon={<role.icon className={`w-5 h-5 text-${role.color}-400`} />}>
                <CardTitle>{role.name}</CardTitle>
                <CardDescription>Role permissions and access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {role.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      {permission}
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 text-slate-200 text-sm font-medium transition-all">
                  Edit Permissions
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
