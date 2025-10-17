/**
 * Cultural Context Component
 * 
 * Cultural sensitivity and context-aware guidance for diverse South African families
 */

import React, { useState, useEffect } from 'react';
import { Globe, Users, Heart, BookOpen, AlertCircle, Info, Star } from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';

const CulturalContext = ({ context: initialContext, caseData }) => {
  const [culturalContext, setCulturalContext] = useState(initialContext);
  const [culturalGuidance, setCulturalGuidance] = useState([]);
  const [communityResources, setCommunityResources] = useState([]);
  const [culturalConsiderations, setCulturalConsiderations] = useState([]);
  const [selectedCulture, setSelectedCulture] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (caseData?.cultural_background) {
      setSelectedCulture(caseData.cultural_background);
      loadCulturalContext(caseData.cultural_background);
    }
    loadCommunityResources();
  }, [caseData]);

  const loadCulturalContext = async (culture) => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/ai/cultural-context/${culture}`);
      if (response.ok) {
        setCulturalContext(response.data);
        setCulturalGuidance(response.data.guidance || []);
        setCulturalConsiderations(response.data.considerations || []);
      }
    } catch (error) {
      console.error('Failed to load cultural context:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityResources = async () => {
    try {
      const response = await apiFetch('/api/ai/community-resources');
      if (response.ok) {
        setCommunityResources(response.data);
      }
    } catch (error) {
      console.error('Failed to load community resources:', error);
    }
  };

  const generateCulturalGuidance = async (specificContext) => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/ai/cultural-guidance', {
        method: 'POST',
        body: JSON.stringify({
          culturalBackground: selectedCulture,
          caseContext: caseData,
          specificContext
        })
      });

      if (response.ok) {
        setCulturalGuidance(prev => [response.data, ...prev]);
      }
    } catch (error) {
      console.error('Cultural guidance generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const southAfricanCultures = [
    {
      code: 'zulu',
      name: 'Zulu',
      population: '22.7%',
      languages: ['isiZulu'],
      traditions: ['Ubuntu philosophy', 'Extended family structures', 'Traditional marriage customs']
    },
    {
      code: 'xhosa',
      name: 'Xhosa',
      population: '16.0%',
      languages: ['isiXhosa'],
      traditions: ['Ancestral reverence', 'Initiation ceremonies', 'Clan-based identity']
    },
    {
      code: 'afrikaner',
      name: 'Afrikaner',
      population: '13.5%',
      languages: ['Afrikaans'],
      traditions: ['Family-centered values', 'Religious considerations', 'Community support']
    },
    {
      code: 'sotho',
      name: 'Sotho',
      population: '8.0%',
      languages: ['Sesotho'],
      traditions: ['Chief consultation', 'Extended family decisions', 'Customary law']
    },
    {
      code: 'tswana',
      name: 'Tswana',
      population: '8.2%',
      languages: ['Setswana'],
      traditions: ['Kgotla (traditional court)', 'Community consensus', 'Elder respect']
    },
    {
      code: 'indian',
      name: 'Indian South African',
      population: '2.5%',
      languages: ['English', 'Tamil', 'Hindi', 'Gujarati'],
      traditions: ['Extended family involvement', 'Religious considerations', 'Community mediation']
    },
    {
      code: 'coloured',
      name: 'Coloured',
      population: '8.8%',
      languages: ['Afrikaans', 'English'],
      traditions: ['Mixed heritage identity', 'Family solidarity', 'Community networks']
    },
    {
      code: 'mixed',
      name: 'Mixed/Multiple Cultures',
      population: '20.3%',
      languages: ['Various'],
      traditions: ['Blended traditions', 'Adaptive customs', 'Modern South African identity']
    }
  ];

  const getCultureIcon = (culture) => {
    const icons = {
      zulu: '🛡️',
      xhosa: '🏺',
      afrikaner: '🏠',
      sotho: '🏔️',
      tswana: '🌾',
      indian: '🕉️',
      coloured: '🎨',
      mixed: '🌍'
    };
    return icons[culture] || '🌍';
  };

  const getCulturalPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[priority] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Culture Selection */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          Cultural Background
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Primary Cultural Background
          </label>
          <select
            value={selectedCulture}
            onChange={(e) => {
              setSelectedCulture(e.target.value);
              if (e.target.value) loadCulturalContext(e.target.value);
            }}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">Select cultural background...</option>
            {southAfricanCultures.map((culture) => (
              <option key={culture.code} value={culture.code}>
                {getCultureIcon(culture.code)} {culture.name} ({culture.population} of SA population)
              </option>
            ))}
          </select>
        </div>

        {selectedCulture && (
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getCultureIcon(selectedCulture)}</span>
              <span className="font-medium text-slate-800">
                {southAfricanCultures.find(c => c.code === selectedCulture)?.name}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-slate-700">Languages:</span>
                <span className="text-slate-600 ml-2">
                  {southAfricanCultures.find(c => c.code === selectedCulture)?.languages.join(', ')}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-slate-700">Key Traditions:</span>
                <ul className="text-slate-600 ml-4 mt-1">
                  {southAfricanCultures.find(c => c.code === selectedCulture)?.traditions.map((tradition, idx) => (
                    <li key={idx} className="list-disc">{tradition}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cultural Context Overview */}
      {culturalContext && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500" />
            Cultural Context Overview
          </h3>

          <div className="space-y-4">
            {/* Family Structure */}
            {culturalContext.family_structure && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Family Structure Considerations
                </h4>
                <div className="text-sm text-blue-700">
                  {culturalContext.family_structure.description}
                </div>
                {culturalContext.family_structure.implications && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-blue-800">Mediation Implications:</div>
                    <ul className="text-xs text-blue-700 list-disc list-inside mt-1">
                      {culturalContext.family_structure.implications.map((implication, idx) => (
                        <li key={idx}>{implication}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Decision Making */}
            {culturalContext.decision_making && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="text-sm font-medium text-purple-800 mb-2">
                  Decision-Making Patterns
                </h4>
                <div className="text-sm text-purple-700">
                  {culturalContext.decision_making.description}
                </div>
                {culturalContext.decision_making.considerations && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-purple-800">Consider:</div>
                    <ul className="text-xs text-purple-700 list-disc list-inside mt-1">
                      {culturalContext.decision_making.considerations.map((consideration, idx) => (
                        <li key={idx}>{consideration}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Communication Style */}
            {culturalContext.communication_style && (
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  Communication Preferences
                </h4>
                <div className="text-sm text-green-700">
                  {culturalContext.communication_style.description}
                </div>
                {culturalContext.communication_style.tips && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-green-800">Communication Tips:</div>
                    <ul className="text-xs text-green-700 list-disc list-inside mt-1">
                      {culturalContext.communication_style.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cultural Considerations */}
      {culturalConsiderations.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            Cultural Considerations
          </h3>
          
          <div className="space-y-3">
            {culturalConsiderations.map((consideration, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border ${getCulturalPriorityColor(consideration.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium">{consideration.title}</h4>
                  <span className="text-xs px-2 py-1 rounded-full">
                    {consideration.priority} priority
                  </span>
                </div>
                
                <div className="text-sm mb-2">
                  {consideration.description}
                </div>

                {consideration.action_items && consideration.action_items.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-1">Recommended Actions:</div>
                    <ul className="text-xs list-disc list-inside space-y-1">
                      {consideration.action_items.map((action, actionIdx) => (
                        <li key={actionIdx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {consideration.sensitive_topics && (
                  <div className="mt-2 p-2 bg-white bg-opacity-50 rounded">
                    <div className="text-xs font-medium">Sensitive Topics:</div>
                    <div className="text-xs">
                      {consideration.sensitive_topics.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Guidance */}
      {culturalGuidance.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            Cultural Guidance
          </h3>
          
          <div className="space-y-3">
            {culturalGuidance.map((guidance, idx) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">
                  {guidance.title || 'Cultural Guidance'}
                </div>
                
                <div className="text-sm text-blue-700 mb-2">
                  {guidance.guidance || guidance.description}
                </div>

                {guidance.examples && guidance.examples.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-blue-800 mb-1">Examples:</div>
                    <ul className="text-xs text-blue-700 list-disc list-inside">
                      {guidance.examples.map((example, exampleIdx) => (
                        <li key={exampleIdx}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {guidance.cultural_context && (
                  <div className="mt-2 p-2 bg-white rounded text-xs text-blue-600">
                    <strong>Cultural Context:</strong> {guidance.cultural_context}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Resources */}
      {communityResources.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Community Resources
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {communityResources.map((resource, idx) => (
              <div key={idx} className="p-3 border rounded-lg hover:bg-slate-50">
                <div className="text-sm font-medium text-slate-800 mb-1">
                  {resource.name}
                </div>
                
                <div className="text-xs text-slate-600 mb-2">
                  {resource.description}
                </div>

                <div className="space-y-1 text-xs">
                  {resource.contact && (
                    <div>
                      <span className="font-medium">Contact:</span> {resource.contact}
                    </div>
                  )}
                  
                  {resource.languages && (
                    <div>
                      <span className="font-medium">Languages:</span> {resource.languages.join(', ')}
                    </div>
                  )}
                  
                  {resource.specialization && (
                    <div>
                      <span className="font-medium">Specialization:</span> {resource.specialization}
                    </div>
                  )}
                </div>

                {resource.cultural_focus && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {resource.cultural_focus.map((focus, focusIdx) => (
                      <span 
                        key={focusIdx}
                        className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Cultural Guidance Generator */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-slate-800 mb-3">Generate Specific Guidance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={() => generateCulturalGuidance('child_custody')}
            disabled={!selectedCulture || loading}
            className="p-2 text-left text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            <div className="font-medium">Child Custody Guidance</div>
            <div className="text-xs text-slate-600">Cultural considerations for custody decisions</div>
          </button>
          
          <button
            onClick={() => generateCulturalGuidance('family_involvement')}
            disabled={!selectedCulture || loading}
            className="p-2 text-left text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            <div className="font-medium">Family Involvement</div>
            <div className="text-xs text-slate-600">Extended family role in decisions</div>
          </button>
          
          <button
            onClick={() => generateCulturalGuidance('communication_style')}
            disabled={!selectedCulture || loading}
            className="p-2 text-left text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            <div className="font-medium">Communication Approach</div>
            <div className="text-xs text-slate-600">Culturally appropriate communication</div>
          </button>
          
          <button
            onClick={() => generateCulturalGuidance('conflict_resolution')}
            disabled={!selectedCulture || loading}
            className="p-2 text-left text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            <div className="font-medium">Conflict Resolution</div>
            <div className="text-xs text-slate-600">Traditional approaches to resolving disputes</div>
          </button>
        </div>
      </div>

      {/* Cultural Sensitivity Reminder */}
      <div className="bg-green-50 border border-green-200 rounded p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-green-800">
            <div className="font-medium mb-1">Cultural Sensitivity Reminder</div>
            <p>
              Cultural guidance is meant to increase awareness and understanding. 
              Every family is unique, and individual circumstances may differ from general cultural patterns. 
              Always prioritize the specific needs and preferences of the parties involved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CulturalContext;