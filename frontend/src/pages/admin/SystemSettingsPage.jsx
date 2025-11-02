import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Bell, Mail, Lock, Database, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';

export default function SystemSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
    autoBackup: true
  });

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
            <h1 className="text-3xl font-bold text-white">System Settings</h1>
            <p className="text-slate-400">Configure platform settings and preferences</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          <Card gradient>
            <CardDecoration color="teal" />
            <CardHeader icon={<Bell className="w-5 h-5 text-teal-400" />}>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingToggle
                label="Email Notifications"
                description="Send email notifications to users"
                checked={settings.emailNotifications}
                onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
              <SettingToggle
                label="SMS Notifications"
                description="Send SMS notifications to users"
                checked={settings.smsNotifications}
                onChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
              />
            </CardContent>
          </Card>

          <Card gradient>
            <CardDecoration color="blue" />
            <CardHeader icon={<Database className="w-5 h-5 text-blue-400" />}>
              <CardTitle>Data & Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingToggle
                label="Automatic Backups"
                description="Automatically backup data daily"
                checked={settings.autoBackup}
                onChange={(checked) => setSettings({ ...settings, autoBackup: checked })}
              />
              <button className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium transition-all border border-blue-500/30">
                Backup Now
              </button>
            </CardContent>
          </Card>

          <Card gradient>
            <CardDecoration color="orange" />
            <CardHeader icon={<Lock className="w-5 h-5 text-orange-400" />}>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingToggle
                label="Maintenance Mode"
                description="Restrict access to administrators only"
                checked={settings.maintenanceMode}
                onChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-teal-500' : 'bg-slate-600'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
