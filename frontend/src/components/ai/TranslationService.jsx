/**
 * Translation Service Component
 * 
 * Multi-language support and real-time translation for South African languages
 */

import React, { useState, useEffect } from 'react';
import { Languages, Volume2, Copy, ArrowLeftRight, Globe, CheckCircle } from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';

const TranslationService = ({ currentLanguage, setCurrentLanguage }) => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [translationHistory, setTranslationHistory] = useState([]);
  const [commonPhrases, setCommonPhrases] = useState([]);

  const supportedLanguages = [
    { code: 'auto', name: 'Auto-detect', flag: '🌐' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
    { code: 'zu', name: 'isiZulu', flag: '🇿🇦' },
    { code: 'xh', name: 'isiXhosa', flag: '🇿🇦' },
    { code: 'st', name: 'Sesotho', flag: '🇿🇦' },
    { code: 'tn', name: 'Setswana', flag: '🇿🇦' },
    { code: 'ts', name: 'Xitsonga', flag: '🇿🇦' },
    { code: 've', name: 'Tshivenda', flag: '🇿🇦' },
    { code: 'ss', name: 'siSwati', flag: '🇿🇦' },
    { code: 'nr', name: 'isiNdebele', flag: '🇿🇦' },
    { code: 'nso', name: 'Sepedi', flag: '🇿🇦' }
  ];

  useEffect(() => {
    loadTranslationHistory();
    loadCommonPhrases();
  }, []);

  useEffect(() => {
    // Update current language when target language changes
    if (setCurrentLanguage && targetLanguage !== 'auto') {
      setCurrentLanguage(targetLanguage);
    }
  }, [targetLanguage, setCurrentLanguage]);

  const loadTranslationHistory = async () => {
    try {
      const response = await apiFetch('/api/ai/translation-history');
      if (response && Array.isArray(response)) {
        setTranslationHistory(response);
      }
    } catch (error) {
      console.error('Failed to load translation history:', error);
    }
  };

  const loadCommonPhrases = async () => {
    try {
      const response = await apiFetch('/api/ai/common-phrases');
      if (response.ok) {
        setCommonPhrases(response.data);
      }
    } catch (error) {
      console.error('Failed to load common phrases:', error);
    }
  };

  const translateText = async (text = sourceText, srcLang = sourceLanguage, tgtLang = targetLanguage) => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await apiFetch('/api/ai/translate', {
        method: 'POST',
        body: JSON.stringify({
          text: text.trim(),
          sourceLanguage: srcLang,
          targetLanguage: tgtLang,
          context: 'legal_mediation'
        })
      });

      if (response.ok) {
        setTranslatedText(response.data.translated_text);
        
        // Add to history
        const newTranslation = {
          id: Date.now(),
          source_text: text,
          translated_text: response.data.translated_text,
          source_language: response.data.detected_language || srcLang,
          target_language: tgtLang,
          confidence: response.data.confidence,
          timestamp: new Date().toISOString()
        };
        
        setTranslationHistory(prev => [newTranslation, ...prev.slice(0, 9)]);

        // Handle cultural notes if provided
        if (response.data.cultural_notes) {
          console.log('Cultural context:', response.data.cultural_notes);
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    if (sourceLanguage === 'auto') return;
    
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const speakText = (text, language) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageCode(language);
      speechSynthesis.speak(utterance);
    }
  };

  const getLanguageCode = (lang) => {
    const codes = {
      'en': 'en-US',
      'af': 'af-ZA',
      'zu': 'zu-ZA',
      'xh': 'xh-ZA',
      'st': 'st-ZA',
      'tn': 'tn-ZA',
      'ts': 'ts-ZA',
      've': 've-ZA',
      'ss': 'ss-ZA',
      'nr': 'nr-ZA',
      'nso': 'nso-ZA'
    };
    return codes[lang] || 'en-US';
  };

  const getLanguageName = (code) => {
    const lang = supportedLanguages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  const insertCommonPhrase = (phrase) => {
    setSourceText(phrase.text);
    translateText(phrase.text);
  };

  const mediationPhrases = [
    {
      category: 'Greetings',
      phrases: [
        { text: 'Good morning, welcome to our mediation session.', priority: 'high' },
        { text: 'How are you feeling today?', priority: 'medium' },
        { text: 'Thank you for being here.', priority: 'low' }
      ]
    },
    {
      category: 'Process Explanation',
      phrases: [
        { text: 'This is a confidential process.', priority: 'high' },
        { text: 'I am here to help you communicate effectively.', priority: 'high' },
        { text: 'We will work together to find solutions.', priority: 'medium' }
      ]
    },
    {
      category: 'Active Listening',
      phrases: [
        { text: 'I understand that you feel...', priority: 'high' },
        { text: 'What I heard you say was...', priority: 'medium' },
        { text: 'Can you help me understand...?', priority: 'medium' }
      ]
    },
    {
      category: 'Child Focus',
      phrases: [
        { text: 'What would be best for the children?', priority: 'high' },
        { text: 'How do you think this affects your child?', priority: 'high' },
        { text: 'The children\'s needs are our priority.', priority: 'high' }
      ]
    },
    {
      category: 'De-escalation',
      phrases: [
        { text: 'Let\'s take a moment to pause.', priority: 'high' },
        { text: 'I can see this is important to you.', priority: 'medium' },
        { text: 'Can we focus on finding solutions?', priority: 'medium' }
      ]
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Language Selection */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
          <Languages className="w-4 h-4 text-blue-500" />
          Language Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Source Language */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={swapLanguages}
              disabled={sourceLanguage === 'auto'}
              className="p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Swap languages"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Target Language */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              {supportedLanguages.filter(lang => lang.code !== 'auto').map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Translation Interface */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                {getLanguageName(sourceLanguage)}
              </label>
              {sourceText && (
                <button
                  onClick={() => speakText(sourceText, sourceLanguage)}
                  className="text-blue-500 hover:text-blue-600"
                  title="Listen"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && e.ctrlKey && translateText()}
              placeholder="Enter text to translate..."
              className="w-full h-32 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-slate-500">
                {sourceText.length} characters
              </span>
              <button
                onClick={() => translateText()}
                disabled={!sourceText.trim() || loading}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                {loading ? 'Translating...' : 'Translate'}
              </button>
            </div>
          </div>

          {/* Translated Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                {getLanguageName(targetLanguage)}
              </label>
              {translatedText && (
                <div className="flex gap-2">
                  <button
                    onClick={() => speakText(translatedText, targetLanguage)}
                    className="text-blue-500 hover:text-blue-600"
                    title="Listen"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(translatedText)}
                    className="text-blue-500 hover:text-blue-600"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="w-full h-32 px-3 py-2 border rounded-lg bg-slate-50 text-slate-700 overflow-y-auto">
              {translatedText || (loading ? 'Translating...' : 'Translation will appear here')}
            </div>
          </div>
        </div>
      </div>

      {/* Common Mediation Phrases */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-green-500" />
          Common Mediation Phrases
        </h3>
        
        <div className="space-y-3">
          {mediationPhrases.map((category, catIdx) => (
            <div key={catIdx}>
              <h4 className="text-sm font-medium text-slate-700 mb-2">{category.category}</h4>
              <div className="grid grid-cols-1 gap-2">
                {category.phrases.map((phrase, phraseIdx) => (
                  <button
                    key={phraseIdx}
                    onClick={() => insertCommonPhrase(phrase)}
                    className={`text-left p-2 text-sm border rounded hover:bg-slate-50 transition-colors ${
                      phrase.priority === 'high' ? 'border-green-200 bg-green-50' :
                      phrase.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-1">{phrase.text}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        phrase.priority === 'high' ? 'bg-green-100 text-green-700' :
                        phrase.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {phrase.priority}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Translation History */}
      {translationHistory.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3">Recent Translations</h3>
          <div className="space-y-2">
            {translationHistory.slice(0, 5).map((translation) => (
              <div key={translation.id} className="p-3 bg-slate-50 rounded border">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm">
                    <span className="text-slate-600">
                      {getLanguageName(translation.source_language)} → {getLanguageName(translation.target_language)}
                    </span>
                    {translation.confidence && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {translation.confidence}% confidence
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(translation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-slate-800">
                    <span className="font-medium">Original:</span> {translation.source_text}
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-medium">Translation:</span> {translation.translated_text}
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setSourceText(translation.source_text);
                      setTranslatedText(translation.translated_text);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Reuse
                  </button>
                  <button
                    onClick={() => copyToClipboard(translation.translated_text)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Support Info */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <div className="font-medium mb-1">South African Language Support</div>
            <p>All 11 official languages supported with cultural context awareness. 
            Legal terminology is preserved for accuracy in mediation contexts.</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <div className="text-xs text-yellow-800">
          <strong>Translation Notice:</strong> While AI translation is helpful for basic communication, 
          consider professional interpreters for complex legal discussions to ensure accuracy and cultural sensitivity.
        </div>
      </div>
    </div>
  );
};

export default TranslationService;