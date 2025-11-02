import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Upload as UploadIcon, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import DivorceeDocumentsPanel from '../components/documents/DivorceeDocumentsPanel';
import DashboardFrame from '../components/DashboardFrame';
import AIInsightsPanel from '../components/ai/AIInsightsPanel';

const UploadsPage = () => {
  const { id } = useParams(); // caseId from route
  const navigate = useNavigate();
  const { user } = useAuth();
  const [score, setScore] = useState({ submittedCount: 0, total: 16 });

  return (
    <DashboardFrame title="Document Uploads">
      <div className="space-y-6">
        {/* Progress Summary */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 mb-2">
                Upload and manage your required divorce mediation documents
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Progress</div>
              <div className="text-2xl font-bold text-white">
                {score.submittedCount} / {score.total}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {Math.round((score.submittedCount / score.total) * 100)}% Complete
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{score.submittedCount}</div>
                <div className="text-sm text-green-400">Submitted</div>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {score.total - score.submittedCount}
                </div>
                <div className="text-sm text-orange-400">Remaining</div>
              </div>
            </div>
          </div>
          
          <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-teal-400" />
              <div>
                <div className="text-2xl font-bold text-white">{score.total}</div>
                <div className="text-sm text-teal-400">Total Required</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <UploadIcon className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Upload Guidelines</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• All documents should be clear, legible PDFs or images (JPG, PNG)</li>
                <li>• Maximum file size: 10MB per document</li>
                <li>• Documents will be reviewed by your mediator within 24-48 hours</li>
                <li>• You can replace any document if changes are needed</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Documents Panel */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            Required Documents
          </h2>
          <DivorceeDocumentsPanel 
            caseId={id} 
            userId={user?.user_id || user?.id} 
            role={user?.role || 'divorcee'} 
            onMetricsChange={setScore}
          />
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-slate-400">
          <p>Need help? Contact your mediator or use the AI Assistant for guidance.</p>
        </div>
      </div>
    </DashboardFrame>
  );
};

export default UploadsPage;
