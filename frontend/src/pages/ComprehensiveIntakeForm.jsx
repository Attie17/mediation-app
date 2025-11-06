import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';
import { ChevronRight, ChevronLeft, Check, User, Home, Heart, Users, DollarSign, FileText, Target, Shield } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User, description: 'Your basic details' },
  { id: 2, title: 'Address & Work', icon: Home, description: 'Where you live and work' },
  { id: 3, title: 'Marriage Details', icon: Heart, description: 'About your marriage' },
  { id: 4, title: 'Children', icon: Users, description: 'Information about children' },
  { id: 4.5, title: 'Safety & Wellbeing', icon: Shield, description: 'Confidential assessment' },
  { id: 5, title: 'Financial', icon: DollarSign, description: 'Assets and support' },
  { id: 6, title: 'Legal', icon: FileText, description: 'Attorney information' },
  { id: 7, title: 'Goals', icon: Target, description: 'What you hope to achieve' }
];

export default function ComprehensiveIntakeForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    firstName: '',
    lastName: '',
    maidenName: '',
    dateOfBirth: '',
    idNumber: '',
    email: '',
    cellPhone: '',
    homePhone: '',
    workPhone: '',
    
    // Step 2: Address & Employment
    residentialAddress: '',
    city: '',
    province: '',
    postalCode: '',
    mailingAddress: '',
    mailingCity: '',
    mailingProvince: '',
    mailingPostalCode: '',
    sameAsResidential: false,
    employer: '',
    occupation: '',
    workAddress: '',
    
    // Step 3: Marriage Details
    spouseFirstName: '',
    spouseLastName: '',
    spouseMaidenName: '',
    dateOfMarriage: '',
    placeOfMarriage: '',
    dateOfSeparation: '',
    marriageType: '', // In community / Out of community
    antenuptialContract: '',
    reasonForDivorce: '',
    
    // Step 4: Children
    hasChildren: '',
    numberOfChildren: 0,
    children: [],
    
    // Step 4.5: Safety & Wellbeing Assessment (IPV Screening)
    safetyFearDuringConflict: '',
    safetyPhysicalViolence: '',
    safetyThreatsOrIntimidation: '',
    safetyFinancialControl: '',
    safetySocialIsolation: '',
    safetyDecisionControl: '',
    safetyEmotionalAbuse: '',
    safetyChildrenWitness: '',
    safetyCurrentlySafe: '',
    safetyNeedSupport: '',
    safetyAdditionalConcerns: '',
    
    // Step 5: Financial Information
    monthlyIncome: '',
    spouseMonthlyIncome: '',
    hasPropertyToSettle: '',
    hasDebtsToSettle: '',
    seekingSpousalSupport: '',
    payingSpousalSupport: '',
    
    // Step 6: Legal Representation
    hasAttorney: '',
    attorneyName: '',
    attorneyFirm: '',
    attorneyPhone: '',
    attorneyEmail: '',
    spouseHasAttorney: '',
    spouseAttorneyName: '',
    
    // Step 7: Goals and Concerns
    primaryGoals: '',
    mainConcerns: '',
    preferredContactMethod: 'Email',
    bestTimeToContact: '',
    additionalInfo: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ')[1] || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
      
      // Auto-copy residential address to mailing if checked
      if (name === 'sameAsResidential' && checked) {
        setFormData(prev => ({
          ...prev,
          mailingAddress: prev.residentialAddress,
          mailingCity: prev.city,
          mailingProvince: prev.province,
          mailingPostalCode: prev.postalCode
        }));
      }
    } else if (name === 'numberOfChildren') {
      const num = parseInt(value) || 0;
      const currentChildren = formData.children || [];
      const newChildren = Array.from({ length: num }, (_, i) => 
        currentChildren[i] || { name: '', dob: '', gender: '', livingWith: '' }
      );
      setFormData(prev => ({ ...prev, numberOfChildren: num, children: newChildren }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleChildChange = (index, field, value) => {
    const newChildren = [...formData.children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setFormData(prev => ({ ...prev, children: newChildren }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.email) {
          setError('Please fill in all required fields (marked with *)');
          return false;
        }
        break;
      case 2:
        if (!formData.residentialAddress || !formData.city) {
          setError('Please provide at least your residential address and city');
          return false;
        }
        break;
      case 3:
        if (!formData.dateOfMarriage) {
          setError('Please provide your date of marriage');
          return false;
        }
        break;
      case 4:
        if (formData.hasChildren === 'yes' && formData.numberOfChildren === 0) {
          setError('Please specify the number of children');
          return false;
        }
        break;
      case 4.5:
        // Safety assessment - require at least 7 of 10 questions answered
        const safetyFields = [
          'safetyFearDuringConflict',
          'safetyPhysicalViolence',
          'safetyThreatsOrIntimidation',
          'safetyFinancialControl',
          'safetySocialIsolation',
          'safetyDecisionControl',
          'safetyEmotionalAbuse',
          'safetyCurrentlySafe',
          'safetyNeedSupport'
        ];
        // Include safetyChildrenWitness only if they have children
        if (formData.hasChildren === 'yes') {
          safetyFields.push('safetyChildrenWitness');
        }
        const answeredCount = safetyFields.filter(field => formData[field] && formData[field] !== '').length;
        const requiredCount = formData.hasChildren === 'yes' ? 8 : 7;
        if (answeredCount < requiredCount) {
          setError(`Please answer at least ${requiredCount} of the safety assessment questions`);
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('You must be logged in. Please sign in first.');
        setLoading(false);
        return;
      }

      // First, submit risk assessment if safety data exists
      const hasSafetyData = formData.safetyFearDuringConflict || 
                            formData.safetyPhysicalViolence ||
                            formData.safetyThreatsOrIntimidation;
      
      if (hasSafetyData) {
        const safetyAssessment = {
          safetyFearDuringConflict: formData.safetyFearDuringConflict,
          safetyPhysicalViolence: formData.safetyPhysicalViolence,
          safetyThreatsOrIntimidation: formData.safetyThreatsOrIntimidation,
          safetyFinancialControl: formData.safetyFinancialControl,
          safetySocialIsolation: formData.safetySocialIsolation,
          safetyDecisionControl: formData.safetyDecisionControl,
          safetyEmotionalAbuse: formData.safetyEmotionalAbuse,
          safetyChildrenWitness: formData.safetyChildrenWitness,
          safetyCurrentlySafe: formData.safetyCurrentlySafe,
          safetyNeedSupport: formData.safetyNeedSupport,
          safetyAdditionalConcerns: formData.safetyAdditionalConcerns
        };

        await apiFetch('/api/users/risk-assessment', {
          method: 'POST',
          body: JSON.stringify(safetyAssessment)
        });
      }

      // Then submit the main profile
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.cellPhone || formData.homePhone || undefined,
        role: 'divorcee',
        profileDetails: {
          role: 'divorcee',
          submittedAt: new Date().toISOString(),
          intakeCompleted: true,
          ...formData
        }
      };

      await apiFetch('/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      navigate('/divorcee');
    } catch (err) {
      setError(err.message || 'Failed to save intake form');
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Maiden Name (if applicable)
                </label>
                <input
                  type="text"
                  name="maidenName"
                  value={formData.maidenName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cell Phone
                </label>
                <input
                  type="tel"
                  name="cellPhone"
                  value={formData.cellPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Home Phone
                </label>
                <input
                  type="tel"
                  name="homePhone"
                  value={formData.homePhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Work Phone
                </label>
                <input
                  type="tel"
                  name="workPhone"
                  value={formData.workPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Residential Address</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="residentialAddress"
                    value={formData.residentialAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Province/State
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Mailing Address</h3>
              
              <div className="mb-4">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="sameAsResidential"
                    checked={formData.sameAsResidential}
                    onChange={handleChange}
                    className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
                  />
                  <span>Same as residential address</span>
                </label>
              </div>

              {!formData.sameAsResidential && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="mailingAddress"
                      value={formData.mailingAddress}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="mailingCity"
                        value={formData.mailingCity}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Province/State
                      </label>
                      <input
                        type="text"
                        name="mailingProvince"
                        value={formData.mailingProvince}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="mailingPostalCode"
                        value={formData.mailingPostalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Employment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Employer
                  </label>
                  <input
                    type="text"
                    name="employer"
                    value={formData.employer}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Work Address
                  </label>
                  <input
                    type="text"
                    name="workAddress"
                    value={formData.workAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Marriage Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Spouse's First Name
                </label>
                <input
                  type="text"
                  name="spouseFirstName"
                  value={formData.spouseFirstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Spouse's Last Name
                </label>
                <input
                  type="text"
                  name="spouseLastName"
                  value={formData.spouseLastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date of Marriage *
                </label>
                <input
                  type="date"
                  name="dateOfMarriage"
                  value={formData.dateOfMarriage}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Place of Marriage
                </label>
                <input
                  type="text"
                  name="placeOfMarriage"
                  value={formData.placeOfMarriage}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date of Separation
                </label>
                <input
                  type="date"
                  name="dateOfSeparation"
                  value={formData.dateOfSeparation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Marriage Type
                </label>
                <select
                  name="marriageType"
                  value={formData.marriageType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select...</option>
                  <option value="in_community">In Community of Property</option>
                  <option value="out_community">Out of Community of Property</option>
                  <option value="accrual">Accrual System</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Antenuptial Contract Details (if applicable)
                </label>
                <textarea
                  name="antenuptialContract"
                  value={formData.antenuptialContract}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason for Divorce (optional)
                </label>
                <textarea
                  name="reasonForDivorce"
                  value={formData.reasonForDivorce}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="You may leave this blank if you prefer"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Children Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Do you have children from this marriage?
              </label>
              <select
                name="hasChildren"
                value={formData.hasChildren}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {formData.hasChildren === 'yes' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Number of Children
                  </label>
                  <input
                    type="number"
                    name="numberOfChildren"
                    value={formData.numberOfChildren}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {formData.children.map((child, index) => (
                  <div key={index} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                    <h4 className="text-lg font-semibold text-white mb-3">Child {index + 1}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={child.name || ''}
                          onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={child.dob || ''}
                          onChange={(e) => handleChildChange(index, 'dob', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Gender
                        </label>
                        <select
                          value={child.gender || ''}
                          onChange={(e) => handleChildChange(index, 'gender', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="">Select...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Currently Living With
                        </label>
                        <select
                          value={child.livingWith || ''}
                          onChange={(e) => handleChildChange(index, 'livingWith', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="">Select...</option>
                          <option value="mother">Mother</option>
                          <option value="father">Father</option>
                          <option value="shared">Shared Custody</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        );

      case 4.5:
        return (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Safety & Wellbeing Assessment</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    These questions help us understand if additional support or process adaptations would benefit your case.
                    Your responses are confidential and will NOT be shared with the other party.
                  </p>
                  <p className="text-blue-300 text-sm font-medium">
                    🔒 Your safety is our priority. Answer honestly so we can provide the best support.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Question 1: Fear during conflicts */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  1. Have you ever felt afraid of your partner during conflicts or disagreements?
                </label>
                <div className="space-y-2">
                  {['Never', 'Rarely', 'Sometimes', 'Often', 'Always'].map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="safetyFearDuringConflict"
                        value={option.toLowerCase()}
                        checked={formData.safetyFearDuringConflict === option.toLowerCase()}
                        onChange={handleChange}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 2: Physical violence */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  2. Have you experienced physical violence or threats of physical violence from your partner?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'no', label: 'No, never' },
                    { value: 'past', label: 'Yes, in the past (not recently)' },
                    { value: 'ongoing', label: 'Yes, it is ongoing or recent' },
                    { value: 'prefer_not_say', label: 'Prefer not to say' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-3 p-3 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="safetyPhysicalViolence"
                        value={option.value}
                        checked={formData.safetyPhysicalViolence === option.value}
                        onChange={handleChange}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 3: Threats or intimidation */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  3. Does your partner use threats, intimidation, or aggressive behavior to control you?
                </label>
                <div className="space-y-2">
                  {['No', 'Occasionally', 'Frequently', 'Unsure'].map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="safetyThreatsOrIntimidation"
                        value={option.toLowerCase()}
                        checked={formData.safetyThreatsOrIntimidation === option.toLowerCase()}
                        onChange={handleChange}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 4: Financial control */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  4. Does your partner control finances, preventing you from accessing money or making financial decisions?
                </label>
                <div className="space-y-2">
                  {['No', 'Sometimes', 'Yes, significantly', 'Not applicable'].map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="safetyFinancialControl"
                        value={option.toLowerCase()}
                        checked={formData.safetyFinancialControl === option.toLowerCase()}
                        onChange={handleChange}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 5: Social isolation */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  5. Does your partner isolate you from family, friends, or support networks?
                </label>
                <div className="space-y-2">
                  {['No', 'Sometimes', 'Frequently', 'Not sure'].map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="safetySocialIsolation"
                        value={option.toLowerCase()}
                        checked={formData.safetySocialIsolation === option.toLowerCase()}
                        onChange={handleChange}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 6: Decision control */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  6. Does your partner make all major decisions without your input or disregard your opinions?
                </label>
                <div className="space-y-2">
                  {['No', 'Sometimes', 'Most of the time', 'Always'].map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="safetyDecisionControl"
                        value={option.toLowerCase()}
                        checked={formData.safetyDecisionControl === option.toLowerCase()}
                        onChange={handleChange}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 7: Emotional abuse */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  7. Does your partner use insults, humiliation, or emotional manipulation to hurt you?
                </label>
                <div className="space-y-2">
                  {['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'].map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="safetyEmotionalAbuse"
                        value={option.toLowerCase()}
                        checked={formData.safetyEmotionalAbuse === option.toLowerCase()}
                        onChange={handleChange}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 8: Children witness */}
              {formData.hasChildren === 'yes' && (
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <label className="block text-sm font-medium text-slate-200 mb-3">
                    8. Have your children witnessed conflicts or violence between you and your partner?
                  </label>
                  <div className="space-y-2">
                    {['No', 'Once or twice', 'Several times', 'Frequently', 'Prefer not to say'].map(option => (
                      <label key={option} className="flex items-center gap-3 p-3 rounded hover:bg-slate-700/50 cursor-pointer">
                        <input
                          type="radio"
                          name="safetyChildrenWitness"
                          value={option.toLowerCase()}
                          checked={formData.safetyChildrenWitness === option.toLowerCase()}
                          onChange={handleChange}
                          className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="text-slate-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Question 9: Currently safe */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  9. Do you currently feel safe in your living situation?
                </label>
                <div className="space-y-2">
                  {['Yes, I feel safe', 'Mostly safe', 'Sometimes unsafe', 'No, I do not feel safe', 'Unsure'].map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="safetyCurrentlySafe"
                        value={option.toLowerCase()}
                        checked={formData.safetyCurrentlySafe === option.toLowerCase()}
                        onChange={handleChange}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 10: Need support */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  10. Would you like information about additional support services (counseling, legal aid, safe housing)?
                </label>
                <div className="space-y-2">
                  {['Yes, please', 'Maybe later', 'No, thank you', 'Already receiving support'].map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="safetyNeedSupport"
                        value={option.toLowerCase()}
                        checked={formData.safetyNeedSupport === option.toLowerCase()}
                        onChange={handleChange}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional concerns - text area */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  Additional Safety Concerns (Optional)
                </label>
                <textarea
                  name="safetyAdditionalConcerns"
                  value={formData.safetyAdditionalConcerns}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Share any other safety concerns or context that would help us support you better..."
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Support resources notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-6">
              <p className="text-yellow-300 text-sm">
                <strong>If you are in immediate danger:</strong> Please contact emergency services at <strong>10111</strong> or the 
                GBV Command Centre at <strong>0800 428 428</strong> (toll-free, 24/7).
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Financial Information</h3>
            <p className="text-slate-400 text-sm mb-4">
              This information helps us understand your financial situation. All information is confidential.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Approximate Monthly Income
                </label>
                <input
                  type="text"
                  name="monthlyIncome"
                  value={formData.monthlyIncome}
                  onChange={handleChange}
                  placeholder="R 0.00"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Spouse's Approximate Monthly Income
                </label>
                <input
                  type="text"
                  name="spouseMonthlyIncome"
                  value={formData.spouseMonthlyIncome}
                  onChange={handleChange}
                  placeholder="R 0.00"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Do you have property to settle?
                </label>
                <select
                  name="hasPropertyToSettle"
                  value={formData.hasPropertyToSettle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unsure">Unsure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Do you have debts to settle?
                </label>
                <select
                  name="hasDebtsToSettle"
                  value={formData.hasDebtsToSettle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unsure">Unsure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Are you seeking spousal support?
                </label>
                <select
                  name="seekingSpousalSupport"
                  value={formData.seekingSpousalSupport}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unsure">Unsure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Will you be paying spousal support?
                </label>
                <select
                  name="payingSpousalSupport"
                  value={formData.payingSpousalSupport}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unsure">Unsure</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Legal Representation</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Do you have an attorney?
              </label>
              <select
                name="hasAttorney"
                value={formData.hasAttorney}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {formData.hasAttorney === 'yes' && (
              <div className="space-y-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <h4 className="text-lg font-semibold text-white">Your Attorney Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Attorney Name
                    </label>
                    <input
                      type="text"
                      name="attorneyName"
                      value={formData.attorneyName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Law Firm
                    </label>
                    <input
                      type="text"
                      name="attorneyFirm"
                      value={formData.attorneyFirm}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="attorneyPhone"
                      value={formData.attorneyPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="attorneyEmail"
                      value={formData.attorneyEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Does your spouse have an attorney?
              </label>
              <select
                name="spouseHasAttorney"
                value={formData.spouseHasAttorney}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unsure">Unsure</option>
              </select>
            </div>

            {formData.spouseHasAttorney === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Spouse's Attorney Name (if known)
                </label>
                <input
                  type="text"
                  name="spouseAttorneyName"
                  value={formData.spouseAttorneyName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Your Goals and Concerns</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                What are your primary goals for this mediation?
              </label>
              <textarea
                name="primaryGoals"
                value={formData.primaryGoals}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="E.g., Fair division of assets, child custody arrangement, peaceful resolution..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                What are your main concerns or worries?
              </label>
              <textarea
                name="mainConcerns"
                value={formData.mainConcerns}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Share any concerns you have about the process..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  name="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="Text">Text Message</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Best Time to Contact You
                </label>
                <select
                  name="bestTimeToContact"
                  value={formData.bestTimeToContact}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select...</option>
                  <option value="Morning (8am-12pm)">Morning (8am-12pm)</option>
                  <option value="Afternoon (12pm-5pm)">Afternoon (12pm-5pm)</option>
                  <option value="Evening (5pm-8pm)">Evening (5pm-8pm)</option>
                  <option value="Anytime">Anytime</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Additional Information (optional)
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Is there anything else you'd like us to know?"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 text-3xl">
            💙
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Client Intake Form
          </h1>
          <p className="text-slate-400">
            Help us understand your situation so we can provide the best support
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-cyan-400">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mb-8 hidden md:flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                  isCompleted 
                    ? 'bg-cyan-500 text-white' 
                    : isActive 
                      ? 'bg-cyan-600 text-white ring-4 ring-cyan-500/30' 
                      : 'bg-slate-700 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <span className={`text-xs font-medium text-center ${
                  isActive ? 'text-cyan-400' : 'text-slate-400'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          
          {/* Current Step Content */}
          <form onSubmit={currentStep === STEPS.length ? handleSubmit : (e) => e.preventDefault()}>
            {renderStepContent()}

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
              )}
              
              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : (
                    <>
                      Complete Intake
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>All information is confidential and will be used solely for mediation purposes.</p>
          <p className="mt-2">Need help? Contact us at support@mediationplatform.com</p>
        </div>

      </div>
    </div>
  );
}
