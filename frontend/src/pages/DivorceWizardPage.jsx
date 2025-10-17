import React from 'react';
import SessionSetup from '../components/wizard/SessionSetup';
import AnnexureAForm from '../components/wizard/AnnexureAForm';

const DivorceWizardPage = () => {
  return (
    <div className="wizard-container">
      <SessionSetup />
      <AnnexureAForm sectionName="annexure-a" title="Annexure A — Parenting Plan" />
      {/* Add more annexure forms and AI panels as needed */}
    </div>
  );
};

export default DivorceWizardPage;
