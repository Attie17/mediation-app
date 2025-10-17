import React, { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { AnnexureAData } from '../../types';

interface AnnexureAFormProps {
  sectionName: string;
  title: string;
}

const AnnexureAForm: React.FC<AnnexureAFormProps> = ({ sectionName, title }) => {
  const { state, updateFormSection, updateApproval } = useSession();
  const [formData, setFormData] = useState<AnnexureAData>({
    children: [{ name: '', age: 0 }],
    primaryResidence: undefined,
    contactSchedule: {},
    holidaySchedule: {},
    decisionMaking: {},
    travelNotice: { domesticDays: 14, internationalDays: 60 },
    relocationProtocol: { noticeDays: 90, mediationRequired: true }
  });

  useEffect(() => {
    const existingSection = state.formSections.find(s => s.section_name === sectionName);
    if (existingSection && existingSection.form_data) {
      setFormData(prev => ({ ...prev, ...existingSection.form_data }));
    }
  }, [state.formSections, sectionName]);

  const getApprovalStatus = (party: 'party1' | 'party2') => {
    const approval = state.approvals.find(a => a.section_name === sectionName && a.party === party);
    return approval?.approved ? 'approved' : 'pending';
  };

  const handleInputChange = (field: string, value: any, index?: number) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newData[parent as keyof AnnexureAData] = {
          ...(newData[parent as keyof AnnexureAData] as any),
          [child]: value
        };
      } else if (field === 'children' && index !== undefined) {
        const children = [...(newData.children || [])];
        children[index] = { ...children[index], ...value };
        newData.children = children;
      } else {
        (newData as any)[field] = value;
      }
      return newData;
    });
  };

  const handleSave = async () => {
    await updateFormSection(sectionName, formData);
  };

  const handleApproval = async (approved: boolean) => {
    if (!state.session) return;
    await updateApproval(sectionName, state.session.current_party, approved);
  };

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...(prev.children || []), { name: '', age: 0 }]
    }));
  };

  const removeChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <details className="section" open>
      <summary>
        <h3>{title}</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`approval-status ${getApprovalStatus('party1')}`}>
            P1: {getApprovalStatus('party1')}
          </span>
          {state.session?.party2_name && (
            <span className={`approval-status ${getApprovalStatus('party2')}`}>
              P2: {getApprovalStatus('party2')}
            </span>
          )}
        </div>
      </summary>
      <div className="content">
        {/* Children Information */}
        <div>
          <h4>Children Information</h4>
          {formData.children?.map((child, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="text" value={child.name} onChange={e => handleInputChange('children', { name: e.target.value }, index)} placeholder="Child's Name" />
              <input type="number" value={child.age} onChange={e => handleInputChange('children', { age: Number(e.target.value) }, index)} placeholder="Age" min={0} />
              <button type="button" onClick={() => removeChild(index)}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addChild}>Add Child</button>
        </div>
        {/* Additional form fields for residence, schedules, etc. can be added here */}
        <button type="button" onClick={handleSave}>Save Section</button>
        <button type="button" onClick={() => handleApproval(true)}>Approve</button>
        <button type="button" onClick={() => handleApproval(false)}>Reject</button>
      </div>
    </details>
  );
};

export default AnnexureAForm;
