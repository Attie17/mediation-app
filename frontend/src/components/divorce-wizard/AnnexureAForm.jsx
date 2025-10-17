import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const AnnexureAForm = ({ sessionData, onSave, onApprove, onConflict }) => {
  const [formData, setFormData] = useState({
    parentingSchedule: '',
    holidaySchedule: '',
    decisionMaking: '',
    communication: '',
    transportation: '',
    childSupport: '',
    medicalCare: '',
    education: '',
    extracurricular: '',
    relocation: ''
  });

  const [approvalStatus, setApprovalStatus] = useState({
    party1: false,
    party2: false
  });

  const [conflicts, setConflicts] = useState([]);
  const [currentParty, setCurrentParty] = useState('party1');

  useEffect(() => {
    // Load existing form data if available
    if (sessionData?.formData?.annexureA) {
      setFormData(sessionData.formData.annexureA);
    }
    if (sessionData?.approvals?.annexureA) {
      setApprovalStatus(sessionData.approvals.annexureA);
    }
  }, [sessionData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave('annexureA', formData);
  };

  const handleApprove = () => {
    const newStatus = {
      ...approvalStatus,
      [currentParty]: true
    };
    setApprovalStatus(newStatus);
    onApprove('annexureA', currentParty);
  };

  const handleConflict = (field, details) => {
    const conflict = {
      field,
      details,
      party: currentParty,
      timestamp: new Date().toISOString()
    };
    setConflicts(prev => [...prev, conflict]);
    onConflict('annexureA', conflict);
  };

  const formSections = [
    {
      title: "Parenting Schedule",
      field: "parentingSchedule",
      placeholder: "Describe the regular parenting schedule including weekdays, weekends, and overnight arrangements..."
    },
    {
      title: "Holiday and Special Occasion Schedule",
      field: "holidaySchedule",
      placeholder: "Detail how holidays, birthdays, school breaks, and special occasions will be shared..."
    },
    {
      title: "Decision Making Authority",
      field: "decisionMaking",
      placeholder: "Specify how major decisions about education, healthcare, religion, and extracurricular activities will be made..."
    },
    {
      title: "Communication Guidelines",
      field: "communication",
      placeholder: "Outline how parents will communicate with each other and with the children..."
    },
    {
      title: "Transportation Arrangements",
      field: "transportation",
      placeholder: "Describe who will handle transportation for exchanges and activities..."
    },
    {
      title: "Child Support",
      field: "childSupport",
      placeholder: "Detail child support amounts, payment schedule, and any special provisions..."
    },
    {
      title: "Medical and Healthcare",
      field: "medicalCare",
      placeholder: "Specify arrangements for medical care, insurance, and health-related decisions..."
    },
    {
      title: "Education",
      field: "education",
      placeholder: "Outline educational decisions, school choice, and academic involvement..."
    },
    {
      title: "Extracurricular Activities",
      field: "extracurricular",
      placeholder: "Describe how extracurricular activities will be chosen and managed..."
    },
    {
      title: "Relocation",
      field: "relocation",
      placeholder: "Specify any restrictions or procedures for relocating with the children..."
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Annexure A - Parenting Plan</h3>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${approvalStatus.party1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              P1: {approvalStatus.party1 ? 'Approved' : 'Pending'}
            </span>
            {sessionData?.mode === 'collaborative' && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${approvalStatus.party2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                P2: {approvalStatus.party2 ? 'Approved' : 'Pending'}
              </span>
            )}
          </div>
        </div>
        
        {sessionData?.mode === 'collaborative' && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setCurrentParty('party1')}
              className={`px-3 py-1 rounded-full text-sm ${currentParty === 'party1' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Party 1
            </button>
            <button
              onClick={() => setCurrentParty('party2')}
              className={`px-3 py-1 rounded-full text-sm ${currentParty === 'party2' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Party 2
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {formSections.map((section, index) => (
          <div key={section.field} className="space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-900">{section.title}</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleConflict(section.field, 'Conflict reported')}
                  className="text-red-600 hover:text-red-800 text-sm"
                  title="Report Conflict"
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <textarea
              value={formData[section.field]}
              onChange={(e) => handleInputChange(section.field, e.target.value)}
              placeholder={section.placeholder}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
            
            {conflicts.filter(c => c.field === section.field).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800 font-medium">Conflict Reported</span>
                </div>
                {conflicts.filter(c => c.field === section.field).map((conflict, idx) => (
                  <div key={idx} className="mt-2 text-sm text-red-700">
                    {conflict.details} - {conflict.party}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Progress
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handleApprove}
              disabled={approvalStatus[currentParty]}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {approvalStatus[currentParty] ? 'Approved' : 'Approve Section'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnexureAForm;