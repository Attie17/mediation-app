import React from 'react';
import { X, HelpCircle, CheckCircle2, Clock, FileText, MessageSquare, Calendar, Users } from 'lucide-react';

export default function ProcessGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const steps = [
    {
      number: 1,
      title: "Initial Intake",
      icon: FileText,
      duration: "5-10 minutes",
      description: "Share basic information about your situation",
      details: [
        "Tell us about your marriage and separation",
        "Provide information about children (if any)",
        "Share basic financial details",
        "No commitment required at this stage"
      ],
      color: "from-blue-500 to-purple-500"
    },
    {
      number: 2,
      title: "Document Upload",
      icon: FileText,
      duration: "1-2 hours total",
      description: "Upload required documents at your own pace",
      details: [
        "16 standard documents needed (we guide you through each one)",
        "Upload anytime - your progress is saved",
        "Our AI helps validate documents before submission",
        "Mediator reviews within 24-48 hours"
      ],
      color: "from-teal-500 to-green-500"
    },
    {
      number: 3,
      title: "Mediator Review",
      icon: Users,
      duration: "2-3 days",
      description: "Your mediator reviews your case",
      details: [
        "Mediator reviews all documents",
        "May request clarifications or additional documents",
        "Prepares initial assessment",
        "You'll receive a message when review is complete"
      ],
      color: "from-orange-500 to-red-500"
    },
    {
      number: 4,
      title: "First Session",
      icon: Calendar,
      duration: "60-90 minutes",
      description: "Meet with your mediator",
      details: [
        "Virtual or in-person (your choice)",
        "Discuss key issues and priorities",
        "Set goals and timeline",
        "Both parties participate"
      ],
      color: "from-pink-500 to-rose-500"
    },
    {
      number: 5,
      title: "Negotiation Sessions",
      icon: MessageSquare,
      duration: "2-4 weeks",
      description: "Work through issues with mediator guidance",
      details: [
        "Usually 2-4 sessions needed",
        "Focus on fair, mutually agreeable solutions",
        "Mediator facilitates discussions",
        "You control the pace and decisions"
      ],
      color: "from-indigo-500 to-blue-500"
    },
    {
      number: 6,
      title: "Agreement Draft",
      icon: FileText,
      duration: "1 week",
      description: "Mediator drafts your settlement agreement",
      details: [
        "Based on decisions made in sessions",
        "You review and provide feedback",
        "Revisions as needed",
        "Lawyers can review (recommended)"
      ],
      color: "from-green-500 to-teal-500"
    },
    {
      number: 7,
      title: "Final Agreement",
      icon: CheckCircle2,
      duration: "1-2 days",
      description: "Sign and complete",
      details: [
        "Final review of agreement",
        "Both parties sign electronically",
        "Receive certified copies",
        "File with court (we can help)"
      ],
      color: "from-teal-600 to-blue-600"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-blue-600 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">What to Expect</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Introduction */}
          <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/30 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-3">Your Mediation Journey</h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              Mediation is a collaborative process where a neutral third party (your mediator) helps you 
              and your spouse reach fair agreements. It's typically faster, less expensive, and less 
              stressful than going to court.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-teal-400 mb-1">4-8 weeks</div>
                <div className="text-sm text-slate-400">Average completion time</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400 mb-1">3-5 sessions</div>
                <div className="text-sm text-slate-400">Typical number of meetings</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400 mb-1">85%+</div>
                <div className="text-sm text-slate-400">Success rate</div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-slate-600 to-transparent"></div>
                  )}
                  
                  {/* Step Card */}
                  <div className="bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-colors p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-sm font-semibold text-slate-500">STEP {step.number}</div>
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Clock className="w-4 h-4" />
                            {step.duration}
                          </div>
                        </div>
                        
                        <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                        <p className="text-slate-300 mb-4">{step.description}</p>
                        
                        <ul className="space-y-2">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="mt-8 bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
            <h3 className="text-lg font-semibold text-white mb-4">Common Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-teal-400 mb-1">Can I have a lawyer during mediation?</h4>
                <p className="text-sm text-slate-300">
                  Yes! While lawyers don't typically attend sessions, we recommend having one review 
                  the final agreement before signing.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-teal-400 mb-1">What if we can't agree on something?</h4>
                <p className="text-sm text-slate-300">
                  Your mediator will help you explore options and find creative solutions. If agreement 
                  isn't possible on certain issues, you can still mediate the rest and resolve those 
                  issues separately.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-teal-400 mb-1">Is mediation legally binding?</h4>
                <p className="text-sm text-slate-300">
                  Yes, once both parties sign the agreement and it's filed with the court, it becomes 
                  a legally binding contract.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 flex justify-between items-center">
          <div className="text-sm text-slate-400">
            💡 Need help? Click "Chat with Mediator" anytime
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
