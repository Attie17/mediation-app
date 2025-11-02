/**
 * ProactiveAINudge - Detects when user needs help and offers assistance
 * Shows friendly prompts when user seems stuck or hesitant
 */

import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, X, HelpCircle, ArrowRight } from 'lucide-react';

export default function ProactiveAINudge({ 
  onOpenAI, 
  page = 'unknown',
  userRole = 'divorcee' 
}) {
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [nudgeType, setNudgeType] = useState('idle'); // 'idle', 'returning', 'hover'
  
  const idleTimerRef = useRef(null);
  const pageVisitsRef = useRef({});
  const lastActivityRef = useRef(Date.now());
  const hasShownNudgeRef = useRef(false);

  // Reset activity timer
  const resetActivity = () => {
    lastActivityRef.current = Date.now();
  };

  // Track page visits
  useEffect(() => {
    const currentPage = page;
    
    // Increment visit count for this page
    pageVisitsRef.current[currentPage] = (pageVisitsRef.current[currentPage] || 0) + 1;
    
    // If user returns to same page 3+ times, offer help
    if (pageVisitsRef.current[currentPage] >= 3 && !hasShownNudgeRef.current) {
      setTimeout(() => {
        triggerNudge('returning');
      }, 2000);
    }
  }, [page]);

  // Detect idle time
  useEffect(() => {
    const checkIdleTime = () => {
      const now = Date.now();
      const idleSeconds = (now - lastActivityRef.current) / 1000;
      
      // Show nudge after 30 seconds of inactivity (only once per page)
      if (idleSeconds > 30 && !showNudge && !hasShownNudgeRef.current) {
        triggerNudge('idle');
      }
    };

    // Set up activity listeners
    const events = ['mousemove', 'keypress', 'scroll', 'click'];
    events.forEach(event => {
      window.addEventListener(event, resetActivity);
    });

    // Check idle time every 5 seconds
    idleTimerRef.current = setInterval(checkIdleTime, 5000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [showNudge]);

  // Trigger a nudge with appropriate message
  const triggerNudge = (type) => {
    setNudgeType(type);
    setNudgeMessage(getNudgeMessage(type, page));
    setShowNudge(true);
    hasShownNudgeRef.current = true;
    
    // Auto-hide after 15 seconds if user doesn't interact
    setTimeout(() => {
      setShowNudge(false);
    }, 15000);
  };

  // Get contextual nudge message
  const getNudgeMessage = (type, currentPage) => {
    const messages = {
      idle: {
        upload: "👋 Need help getting started with uploading documents? I can walk you through it step-by-step!",
        dashboard: "💡 Looking for something? I'm here to help you navigate the mediation process!",
        case_overview: "🤔 Want to know what each section means? I can explain your case details!",
        default: "👋 I'm here to help! Would you like guidance on what to do next?"
      },
      returning: {
        upload: "📄 I noticed you're back on the uploads page. Having trouble finding the right documents? Let's figure it out together!",
        dashboard: "🔄 Seems like you're exploring. Want a quick tour of your dashboard and what everything means?",
        case_overview: "🔄 Looking for something specific in your case? I can help you find it!",
        default: "🔄 I see you're back here. Need any clarification or guidance?"
      },
      hover: {
        default: "❓ That's a great question! Click here and I'll explain everything."
      }
    };

    return messages[type]?.[currentPage] || messages[type]?.default || messages.idle.default;
  };

  // Handle user clicking the nudge
  const handleNudgeClick = () => {
    setShowNudge(false);
    onOpenAI?.();
  };

  // Handle dismissing the nudge
  const handleDismiss = () => {
    setShowNudge(false);
  };

  if (!showNudge) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
      <div className="relative">
        {/* Speech bubble pointer */}
        <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-teal-600"></div>
        
        {/* Nudge card */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-xl shadow-2xl p-4 max-w-sm relative">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Message */}
          <div className="pr-6 mb-3">
            <p className="text-sm font-medium leading-relaxed">
              {nudgeMessage}
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={handleNudgeClick}
            className="bg-white text-teal-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-teal-50 transition-all flex items-center gap-2 w-full justify-center"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask AI Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0) translateY(20px);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to detect when user hovers over help icons
 */
export function useHelpHoverDetection(onHoverDetected) {
  useEffect(() => {
    let hoverTimer;
    let hoverCount = 0;

    const handleHelpIconHover = (e) => {
      // Check if hovering over help icon or tooltip
      const isHelpElement = e.target.closest('[aria-label*="help"]') || 
                           e.target.closest('[data-help]') ||
                           e.target.classList.contains('help-icon');
      
      if (isHelpElement) {
        hoverCount++;
        
        // If user hovers help icons 2+ times in 30 seconds, they might be confused
        if (hoverCount >= 2) {
          onHoverDetected?.();
          hoverCount = 0; // Reset
        }

        // Reset count after 30 seconds
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          hoverCount = 0;
        }, 30000);
      }
    };

    window.addEventListener('mouseover', handleHelpIconHover);

    return () => {
      window.removeEventListener('mouseover', handleHelpIconHover);
      clearTimeout(hoverTimer);
    };
  }, [onHoverDetected]);
}
