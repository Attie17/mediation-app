
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DivorceeWorkspace() {
  const progress = 40;
  const navigate = useNavigate();
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 md:p-12 text-white">
      <div className="w-full max-w-md">
        <h3 className="text-2xl font-bold mb-4">Divorcee Dashboard</h3>
        <p className="mb-6 text-lg">Complete your document uploads to move forward.</p>
        <div className="w-full bg-blue-700/40 rounded-full h-3 mb-2">
          <div className="bg-white h-3 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm mb-6">{progress}% of documents uploaded</p>

        {/* Chat Buttons */}
        <div className="flex flex-col gap-3 mb-8">
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-white shadow hover:from-blue-600 hover:to-cyan-600"
            onClick={() => navigate('/chat/start')}
          >
            Start Chat
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg font-semibold text-white shadow hover:from-teal-600 hover:to-blue-600"
            onClick={() => navigate('/chat/mediator')}
          >
            Chat to Mediator
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg font-semibold text-white shadow hover:from-purple-600 hover:to-indigo-600"
            onClick={() => navigate('/chat/ai-assistant')}
          >
            Ask AI Assistant
          </button>
        </div>

        {/* Info Buttons */}
        <div className="flex flex-col gap-2">
          <button
            className="px-6 py-2 bg-slate-700 rounded-lg text-white font-medium hover:bg-slate-600"
            onClick={() => navigate('/faq')}
          >
            FAQs
          </button>
          <button
            className="px-6 py-2 bg-slate-700 rounded-lg text-white font-medium hover:bg-slate-600"
            onClick={() => navigate('/what-to-expect')}
          >
            What to Expect
          </button>
          <button
            className="px-6 py-2 bg-slate-700 rounded-lg text-white font-medium hover:bg-slate-600"
            onClick={() => navigate('/privacy-policy')}
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
}
