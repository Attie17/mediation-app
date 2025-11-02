import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown, ChevronRight, FileText, MessageSquare, Calendar, Shield, CreditCard, Users } from 'lucide-react';

export default function FAQModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [openCategory, setOpenCategory] = useState('getting-started');
  const [openQuestion, setOpenQuestion] = useState(null);

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: HelpCircle,
      questions: [
        {
          q: "How do I create a case?",
          a: "Click the 'Start New Case' button on your dashboard, complete the intake form with basic information about your situation, and submit. Your case will be created immediately and a mediator will be assigned within 24 hours."
        },
        {
          q: "What documents do I need?",
          a: "You'll need 16 standard documents including: ID, marriage certificate, financial statements (bank statements, pay stubs, tax returns), property deeds, and information about children if applicable. Don't worry - we provide a checklist and guide you through each one!"
        },
        {
          q: "How long does the process take?",
          a: "Most cases are completed in 4-8 weeks, depending on complexity and how quickly both parties can meet. Simple cases with good communication can sometimes be done in as little as 2-3 weeks."
        },
        {
          q: "Do both of us need to create accounts?",
          a: "Only one person needs to create the case. Your mediator will send an invitation to your spouse/partner to join the case and create their account."
        }
      ]
    },
    {
      id: 'documents',
      title: 'Documents & Uploads',
      icon: FileText,
      questions: [
        {
          q: "What file formats can I upload?",
          a: "We accept PDF, JPG, PNG, and JPEG files. PDFs are preferred for text documents. Maximum file size is 10MB per document."
        },
        {
          q: "Can I upload documents from my phone?",
          a: "Yes! Our mobile interface lets you take photos of documents or select from your gallery. We'll help you organize them."
        },
        {
          q: "What if I upload the wrong document?",
          a: "No problem! You can delete and re-upload anytime. If a document has already been reviewed, just upload a new version and notify your mediator."
        },
        {
          q: "Are my documents secure?",
          a: "Absolutely. All documents are encrypted in transit and at rest. Only you, your spouse/partner, your mediator, and your lawyers (if involved) can access them. See our Privacy Policy for details."
        },
        {
          q: "What if I don't have all documents yet?",
          a: "That's okay! Upload what you have and come back later for the rest. Your progress is saved automatically. You can work on it over several sessions."
        }
      ]
    },
    {
      id: 'sessions',
      title: 'Mediation Sessions',
      icon: Calendar,
      questions: [
        {
          q: "Are sessions in-person or virtual?",
          a: "Both options are available! Most sessions are conducted via video call for convenience, but in-person sessions can be arranged if preferred."
        },
        {
          q: "How long are sessions?",
          a: "Initial sessions are typically 60-90 minutes. Follow-up sessions are usually 60 minutes. The number of sessions varies (usually 3-5 total)."
        },
        {
          q: "Can I reschedule a session?",
          a: "Yes, with at least 24 hours notice. Use the 'Request Reschedule' button on your dashboard or contact your mediator directly."
        },
        {
          q: "Do I need to attend every session?",
          a: "Yes, both parties should attend all sessions. The mediator facilitates discussions between you and your spouse/partner to reach agreements."
        },
        {
          q: "What should I prepare before a session?",
          a: "Review any documents your mediator sends, think about your priorities, and prepare questions. We'll send you a preparation checklist before each session."
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication',
      icon: MessageSquare,
      questions: [
        {
          q: "How do I contact my mediator?",
          a: "Use the 'Chat with Mediator' button on your dashboard for direct messages. You can also communicate during scheduled sessions."
        },
        {
          q: "How quickly will my mediator respond?",
          a: "Mediators typically respond within 24 hours on business days. For urgent matters, you can request a callback."
        },
        {
          q: "Can I communicate with my spouse through the platform?",
          a: "Direct messaging between spouses is not enabled to maintain appropriate boundaries. All communication should go through your mediator."
        },
        {
          q: "Will I receive email notifications?",
          a: "Yes! You'll get notifications for new messages, document reviews, upcoming sessions, and important updates. You can customize notification settings in your profile."
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      questions: [
        {
          q: "Who can see my information?",
          a: "Only you, your spouse/partner, your assigned mediator, and any lawyers involved in your case. Platform administrators can only access data with your explicit consent for technical support."
        },
        {
          q: "Is my data encrypted?",
          a: "Yes! We use military-grade encryption (TLS/SSL for transit, AES-256 for storage). Your data is as secure as your bank account."
        },
        {
          q: "Can I delete my account?",
          a: "Yes, you can request account deletion anytime. We're required to retain certain data for 7 years for legal purposes, but it will be anonymized."
        },
        {
          q: "What happens to my data after my case is closed?",
          a: "Your data is retained for 7 years (legal requirement), then permanently deleted unless you request earlier deletion or data export."
        }
      ]
    },
    {
      id: 'cost',
      title: 'Cost & Payment',
      icon: CreditCard,
      questions: [
        {
          q: "How much does mediation cost?",
          a: "Costs vary by complexity. Simple cases start around $1,500-2,500 total. Your mediator will provide a detailed fee estimate during your initial consultation."
        },
        {
          q: "Do you offer payment plans?",
          a: "Yes! Most mediators offer flexible payment plans. Discuss options with your mediator during your first session."
        },
        {
          q: "What's included in the fee?",
          a: "Typically includes all mediation sessions, document review, draft agreement preparation, and follow-up revisions. Additional services (like court filing) may have separate fees."
        },
        {
          q: "Is this cheaper than a lawyer?",
          a: "Usually yes! Traditional divorce litigation can cost $15,000-50,000+ per person. Mediation typically costs $2,000-10,000 total for both parties combined."
        }
      ]
    },
    {
      id: 'legal',
      title: 'Legal Questions',
      icon: Users,
      questions: [
        {
          q: "Is the mediator my lawyer?",
          a: "No. Mediators are neutral third parties who facilitate discussions. They cannot provide legal advice to either party. We recommend having your own lawyer review the final agreement."
        },
        {
          q: "Is the agreement legally binding?",
          a: "Yes, once signed by both parties and filed with the court, the mediated agreement becomes a legally binding contract."
        },
        {
          q: "What if we can't agree on everything?",
          a: "You can still mediate issues where you do agree and resolve the remaining issues through other means (lawyers, court, etc.). Partial agreements are common and helpful."
        },
        {
          q: "Do I need a lawyer?",
          a: "Not required, but recommended. Many people successfully complete mediation without lawyers, but having one review the final agreement protects your interests."
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-64 bg-slate-900/50 border-r border-slate-700 overflow-y-auto flex-shrink-0">
            <div className="p-4 space-y-1">
              {categories.map(cat => {
                const Icon = cat.icon;
                const isActive = openCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setOpenCategory(cat.id);
                      setOpenQuestion(null);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{cat.title}</span>
                    <div className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-slate-700'
                    }`}>
                      {categories.find(c => c.id === cat.id)?.questions.length}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto p-6">
            {categories
              .filter(cat => cat.id === openCategory)
              .map(category => (
                <div key={category.id}>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    {React.createElement(category.icon, { className: "w-6 h-6 text-teal-400" })}
                    {category.title}
                  </h3>
                  <div className="space-y-3">
                    {category.questions.map((item, index) => {
                      const isOpen = openQuestion === `${category.id}-${index}`;
                      return (
                        <div
                          key={index}
                          className="bg-slate-700/30 rounded-lg border border-slate-600/50 overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenQuestion(isOpen ? null : `${category.id}-${index}`)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors"
                          >
                            <span className="font-medium text-white pr-4">{item.q}</span>
                            {isOpen ? (
                              <ChevronDown className="w-5 h-5 text-teal-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4">
                              <div className="border-t border-slate-600 pt-3">
                                <p className="text-slate-300 leading-relaxed">{item.a}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 p-4 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-slate-400">
            💬 Still have questions? <span className="text-teal-400 cursor-pointer hover:underline">Chat with us</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
