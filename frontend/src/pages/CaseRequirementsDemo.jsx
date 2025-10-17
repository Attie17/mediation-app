import React, { useState } from 'react';
import CaseRequirementsPanel from '../components/CaseRequirementsPanel';

const CaseRequirementsDemo = () => {
  const [selectedCaseId, setSelectedCaseId] = useState('4');

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Case Requirements Management</h1>
          <p className="mt-2 text-gray-600">
            Manage document requirements for mediation cases
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="case-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Case ID:
          </label>
          <select
            id="case-select"
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a case...</option>
            <option value="1">Case 1</option>
            <option value="2">Case 2</option>
            <option value="3">Case 3</option>
            <option value="4">Case 4</option>
            <option value="5">Case 5</option>
          </select>
        </div>

        <CaseRequirementsPanel caseId={selectedCaseId} />
      </div>
    </div>
  );
};

export default CaseRequirementsDemo;