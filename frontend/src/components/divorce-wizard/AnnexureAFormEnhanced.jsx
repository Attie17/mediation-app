import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Save, ThumbsUp, ThumbsDown } from 'lucide-react';

const AnnexureAFormEnhanced = ({ sessionData, onSave, onApproval, onConflict }) => {
  const [formData, setFormData] = useState({
    children: [{ name: '', age: 0, dob: '' }],
    primaryResidence: '',
    contactSchedule: {
      weekPattern: '',
      pickupTimes: '',
      dropoffTimes: ''
    },
    holidaySchedule: {
      pattern: '',
      details: ''
    },
    decisionMaking: {
      education: '',
      medical: '',
      extracurricular: '',
      tieBreaker: ''
    },
    travelNotice: {
      domesticDays: 14,
      internationalDays: 60
    },
    relocationProtocol: {
      noticeDays: 90,
      mediationRequired: true
    }
  });

  const [approvalStatus, setApprovalStatus] = useState({
    party1: false,
    party2: false
  });

  const [conflicts, setConflicts] = useState([]);
  const [currentParty, setCurrentParty] = useState('party1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load existing form data if available
    if (sessionData?.formData?.annexureA) {
      setFormData(prev => ({ ...prev, ...sessionData.formData.annexureA }));
    }
    if (sessionData?.approvals?.annexureA) {
      setApprovalStatus(sessionData.approvals.annexureA);
    }
    if (sessionData?.current_party) {
      setCurrentParty(sessionData.current_party);
    }
  }, [sessionData]);

  const handleInputChange = (field, value, index = null) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newData[parent] = {
          ...newData[parent],
          [child]: value
        };
      } else if (field === 'children' && index !== null) {
        const children = [...newData.children];
        children[index] = { ...children[index], ...value };
        newData.children = children;
      } else {
        newData[field] = value;
      }
      
      return newData;
    });
  };

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, { name: '', age: 0, dob: '' }]
    }));
  };

  const removeChild = (index) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave('annexure-a', formData);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const newStatus = {
        ...approvalStatus,
        [currentParty]: true
      };
      setApprovalStatus(newStatus);
      await onApproval('annexure-a', currentParty, true);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const newStatus = {
        ...approvalStatus,
        [currentParty]: false
      };
      setApprovalStatus(newStatus);
      await onApproval('annexure-a', currentParty, false);
    } finally {
      setLoading(false);
    }
  };

  const handleConflict = async (field, details) => {
    const conflict = {
      field,
      details,
      party: currentParty,
      timestamp: new Date().toISOString()
    };
    setConflicts(prev => [...prev, conflict]);
    if (onConflict) {
      await onConflict('annexure-a', conflict);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Annexure A — Parenting Plan</h3>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              approvalStatus.party1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              P1: {approvalStatus.party1 ? 'Approved' : 'Pending'}
            </span>
            {sessionData?.mode === 'collaborative' && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                approvalStatus.party2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                P2: {approvalStatus.party2 ? 'Approved' : 'Pending'}
              </span>
            )}
          </div>
        </div>
        
        {sessionData?.mode === 'collaborative' && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setCurrentParty('party1')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                currentParty === 'party1' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Party 1
            </button>
            <button
              onClick={() => setCurrentParty('party2')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                currentParty === 'party2' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Party 2
            </button>
          </div>
        )}
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-8">
        {/* Children Information */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">Children Information</h4>
            <button
              onClick={() => handleConflict('children', 'Conflict reported on children information')}
              className="text-red-600 hover:text-red-800 text-sm flex items-center space-x-1"
              title="Report Conflict"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Report Issue</span>
            </button>
          </div>
          
          {formData.children.map((child, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h5 className="font-medium text-gray-700">Child {index + 1}</h5>
                {formData.children.length > 1 && (
                  <button
                    onClick={() => removeChild(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => handleInputChange('children', { name: e.target.value }, index)}
                    placeholder="Enter child's full name"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={child.age}
                    onChange={(e) => handleInputChange('children', { age: parseInt(e.target.value) || 0 }, index)}
                    min="0"
                    max="25"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={child.dob}
                    onChange={(e) => handleInputChange('children', { dob: e.target.value }, index)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            onClick={addChild}
            className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            + Add Another Child
          </button>
        </div>

        {/* Primary Residence */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Primary Residence</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Where will the child(ren) primarily live?
            </label>
            <select
              value={formData.primaryResidence}
              onChange={(e) => handleInputChange('primaryResidence', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select primary residence</option>
              <option value="mother">With Mother</option>
              <option value="father">With Father</option>
              <option value="shared">Shared Residence</option>
            </select>
          </div>
        </div>

        {/* Contact Schedule */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Contact Schedule</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week Pattern
              </label>
              <input
                type="text"
                value={formData.contactSchedule.weekPattern}
                onChange={(e) => handleInputChange('contactSchedule.weekPattern', e.target.value)}
                placeholder="e.g., Alternate weekends"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup/Drop-off Times
              </label>
              <input
                type="text"
                value={formData.contactSchedule.pickupTimes}
                onChange={(e) => handleInputChange('contactSchedule.pickupTimes', e.target.value)}
                placeholder="e.g., Friday 6PM / Sunday 6PM"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Holiday Schedule */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Holiday Schedule</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Holiday Pattern
              </label>
              <select
                value={formData.holidaySchedule.pattern}
                onChange={(e) => handleInputChange('holidaySchedule.pattern', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select pattern</option>
                <option value="alternate-halves">Alternate Halves</option>
                <option value="alternate-full">Alternate Full Holidays</option>
                <option value="custom">Custom Arrangement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Details
              </label>
              <textarea
                value={formData.holidaySchedule.details}
                onChange={(e) => handleInputChange('holidaySchedule.details', e.target.value)}
                placeholder="Describe specific holiday arrangements"
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Decision Making */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Decision Making</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Decisions
              </label>
              <select
                value={formData.decisionMaking.education}
                onChange={(e) => handleInputChange('decisionMaking.education', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="joint">Joint Decision</option>
                <option value="mother">Mother Decides</option>
                <option value="father">Father Decides</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Decisions
              </label>
              <select
                value={formData.decisionMaking.medical}
                onChange={(e) => handleInputChange('decisionMaking.medical', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="joint">Joint Decision</option>
                <option value="mother">Mother Decides</option>
                <option value="father">Father Decides</option>
              </select>
            </div>
          </div>
        </div>

        {/* Travel Notice */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Travel Notice Requirements</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domestic Travel Notice (days)
              </label>
              <input
                type="number"
                value={formData.travelNotice.domesticDays}
                onChange={(e) => handleInputChange('travelNotice.domesticDays', parseInt(e.target.value) || 14)}
                min="1"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                International Travel Notice (days)
              </label>
              <input
                type="number"
                value={formData.travelNotice.internationalDays}
                onChange={(e) => handleInputChange('travelNotice.internationalDays', parseInt(e.target.value) || 60)}
                min="1"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Conflicts Display */}
        {conflicts.length > 0 && (
          <div className="border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <h4 className="font-medium text-red-800">Reported Conflicts</h4>
            </div>
            {conflicts.map((conflict, index) => (
              <div key={index} className="text-sm text-red-700 mb-1">
                {conflict.details} - Reported by {conflict.party}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Progress'}</span>
          </button>
          
          <button
            onClick={handleApprove}
            disabled={loading || approvalStatus[currentParty]}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{approvalStatus[currentParty] ? 'Approved' : 'Approve Section'}</span>
          </button>

          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>Reject Section</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnexureAFormEnhanced;