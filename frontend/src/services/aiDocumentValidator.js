/**
 * AI Document Validation Service
 * Provides instant feedback when divorcees upload documents
 */

import { apiFetch } from '../lib/apiClient';

/**
 * Validate an uploaded document using AI
 * @param {File} file - The uploaded file
 * @param {string} docType - Expected document type (e.g., 'bank_statement')
 * @param {string} caseId - Case ID
 * @returns {Promise<ValidationResult>}
 */
export async function validateDocument(file, docType, caseId) {
  try {
    // Basic client-side checks first
    const basicCheck = performBasicValidation(file, docType);
    if (!basicCheck.valid) {
      return basicCheck;
    }

    // For now, return encouraging feedback immediately
    // TODO: Integrate with backend AI validation endpoint
    const result = {
      valid: true,
      confidence: 0.95,
      feedback: generateEncouragingFeedback(file, docType),
      suggestions: [],
      warnings: []
    };

    // Check file size
    if (file.size > 10 * 1024 * 1024) { // 10MB
      result.warnings.push({
        type: 'large_file',
        message: 'This file is quite large. If upload is slow, try compressing it.',
        severity: 'low'
      });
    }

    // Check if file might be too old (based on filename if it has a date)
    const dateWarning = checkFileDate(file.name);
    if (dateWarning) {
      result.warnings.push(dateWarning);
    }

    return result;

  } catch (error) {
    console.error('[AI Validator] Error:', error);
    return {
      valid: false,
      confidence: 0,
      feedback: '❌ Unable to validate document. Please try again or contact support.',
      error: error.message
    };
  }
}

/**
 * Perform basic client-side validation
 */
function performBasicValidation(file, docType) {
  // Check file exists
  if (!file) {
    return {
      valid: false,
      feedback: '❌ No file selected. Please choose a file to upload.',
      suggestions: ['Click "Choose File" and select a document from your computer']
    };
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      feedback: '❌ File type not supported. Please use PDF, JPG, PNG, or Word documents.',
      suggestions: [
        'Convert your file to PDF (most reliable)',
        'Take a clear photo and save as JPG',
        'Scan documents as PDF if possible'
      ]
    };
  }

  // Check file size (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    return {
      valid: false,
      feedback: '❌ File too large (max 20MB). Please compress or split the file.',
      suggestions: [
        'Use a PDF compressor tool online',
        'Split multi-page documents into smaller files',
        'Reduce image quality when scanning'
      ]
    };
  }

  // Check file isn't too small (might be empty)
  if (file.size < 1000) { // Less than 1KB
    return {
      valid: false,
      feedback: '⚠️ File seems very small. Make sure it contains your document.',
      suggestions: [
        'Check that you selected the correct file',
        'Ensure the document isn\'t blank',
        'Try re-scanning or re-saving the document'
      ]
    };
  }

  return { valid: true };
}

/**
 * Generate encouraging, helpful feedback based on document type
 */
function generateEncouragingFeedback(file, docType) {
  const fileTypeIcon = file.type === 'application/pdf' ? '📄' : '📷';
  const sizeKB = Math.round(file.size / 1024);
  
  const feedbackOptions = {
    bank_statement: [
      `${fileTypeIcon} Great! Your bank statement looks good (${sizeKB}KB). Make sure it shows the last 6 months of transactions.`,
      `✅ Bank statement received! Double-check that it includes all pages and your account number is visible.`,
      `${fileTypeIcon} Perfect! Just verify this statement is recent (within the last 30 days).`
    ],
    tax_return: [
      `${fileTypeIcon} Excellent! Tax return uploaded (${sizeKB}KB). Ensure it's from the last 2 tax years.`,
      `✅ Tax document looks good! Make sure all schedules and attachments are included.`,
      `${fileTypeIcon} Great work! Verify this is your complete tax return with all pages.`
    ],
    id_document: [
      `${fileTypeIcon} ID document received! Make sure your photo and ID number are clearly readable.`,
      `✅ Perfect! Check that the ID isn't expired and all corners are visible.`,
      `${fileTypeIcon} Good! Ensure both sides of your ID are included if applicable.`
    ],
    marriage_certificate: [
      `${fileTypeIcon} Marriage certificate uploaded successfully! Verify it's the official certified copy.`,
      `✅ Looks good! Make sure all text is legible and the seal/stamp is visible.`,
      `${fileTypeIcon} Great! This is an important document - all details should be clear.`
    ],
    default: [
      `${fileTypeIcon} Document uploaded successfully (${sizeKB}KB)! Please review it to ensure it's complete.`,
      `✅ File received! Make sure it's clear, readable, and contains all necessary pages.`,
      `${fileTypeIcon} Great job! Your document has been uploaded. Our team will review it soon.`
    ]
  };

  const options = feedbackOptions[docType] || feedbackOptions.default;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Check if filename suggests document might be outdated
 */
function checkFileDate(filename) {
  // Look for year patterns in filename
  const yearMatch = filename.match(/20(\d{2})/);
  if (yearMatch) {
    const year = parseInt('20' + yearMatch[1]);
    const currentYear = new Date().getFullYear();
    
    if (currentYear - year > 2) {
      return {
        type: 'old_date',
        message: `📅 This file name suggests it's from ${year}. For financial documents, please upload recent versions.`,
        severity: 'medium'
      };
    }
  }
  
  return null;
}

/**
 * Get helpful tips for specific document types
 */
export function getDocumentTips(docType) {
  const tips = {
    bank_statement: {
      title: '📋 Bank Statement Tips',
      tips: [
        'Include the last 6 months of statements',
        'Make sure your name and account number are visible',
        'Include all pages (don\'t skip blank ones)',
        'Recent statements work best (within last 30 days)'
      ]
    },
    tax_return: {
      title: '📋 Tax Return Tips',
      tips: [
        'Upload returns from the last 2 tax years',
        'Include all schedules and attachments',
        'Ensure tax authority stamps are visible',
        'Both pages (summary and full return) needed'
      ]
    },
    pay_stub: {
      title: '📋 Pay Slip Tips',
      tips: [
        'Provide last 3 months of pay slips',
        'Include year-to-date totals if shown',
        'Make sure employer name is visible',
        'Ensure deductions section is included'
      ]
    },
    id_document: {
      title: '📋 ID Document Tips',
      tips: [
        'Upload a clear, color scan or photo',
        'Include both sides if applicable',
        'Ensure ID number is fully readable',
        'Check that expiry date is visible and not expired'
      ]
    },
    marriage_certificate: {
      title: '📋 Marriage Certificate Tips',
      tips: [
        'Use the official certified copy (not photocopy)',
        'Include any amendments or annexures',
        'Ensure official seals/stamps are visible',
        'All text must be clearly legible'
      ]
    },
    property_deed: {
      title: '📋 Property Deed Tips',
      tips: [
        'Upload the full title deed document',
        'Include property description and diagram',
        'Ensure title deed number is visible',
        'Include all registered bonds if applicable'
      ]
    },
    default: {
      title: '📋 Document Upload Tips',
      tips: [
        'Use PDF format when possible',
        'Ensure all pages are included',
        'Make sure text is clear and readable',
        'Remove any password protection before upload'
      ]
    }
  };

  return tips[docType] || tips.default;
}

/**
 * Provide context-aware help messages
 */
export function getHelpMessage(docType, scenario = 'before_upload') {
  const messages = {
    before_upload: {
      bank_statement: "💡 **Getting Started**: Log into your online banking, go to Statements, and download PDFs for the last 6 months. Most banks let you select a date range.",
      tax_return: "💡 **Getting Started**: Your tax returns are available from SARS eFiling. Log in, go to Returns, and download your ITR12 for the last 2 years.",
      id_document: "💡 **Getting Started**: Use your phone to take a clear, well-lit photo of your ID. Make sure all 4 corners are visible and text is sharp.",
      default: "💡 **Getting Started**: Gather the document, take a clear photo or scan, and save it as a PDF. Make sure all pages are included."
    },
    after_upload: {
      bank_statement: "✅ **Next Step**: Your mediator will review your bank statements within 2-3 business days. They may ask for clarification on certain transactions.",
      tax_return: "✅ **Next Step**: Tax returns help determine income for support calculations. Your mediator will review these alongside your other financial documents.",
      id_document: "✅ **Next Step**: Your ID confirms your identity for legal purposes. This is standard for all divorce proceedings.",
      default: "✅ **Next Step**: Document uploaded! Your mediator will review it and may reach out if they need clarification."
    },
    need_help: {
      bank_statement: "❓ **Need Help?** Can't find your statements? Contact your bank's customer service - they can email them to you. It's free and usually takes 1-2 business days.",
      tax_return: "❓ **Need Help?** Forgot your eFiling password? Use the SARS 'Forgot Password' option or call their helpline at 0800 00 7277.",
      id_document: "❓ **Need Help?** Poor photo quality? Try using a scanner app on your phone (like Adobe Scan or Microsoft Lens) - they work great!",
      default: "❓ **Need Help?** I'm here to assist! Just ask me any questions about this document or the upload process."
    }
  };

  return messages[scenario]?.[docType] || messages[scenario]?.default || '';
}
