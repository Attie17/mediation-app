import React from 'react';
import { X, Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-blue-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-slate-300">
          {/* Last Updated */}
          <div className="text-sm text-slate-400 italic">
            Last Updated: October 2024
          </div>

          {/* Introduction */}
          <section>
            <p className="leading-relaxed">
              Your privacy is critically important to us. This mediation platform is designed to protect your 
              sensitive information during one of the most personal times in your life. We are committed to 
              maintaining your trust and confidence.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-teal-400" />
              <h3 className="text-xl font-semibold text-white">Information We Collect</h3>
            </div>
            <div className="space-y-3 pl-7">
              <div>
                <h4 className="font-medium text-white mb-1">Personal Information</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Name, email address, phone number</li>
                  <li>Date of birth and contact information</li>
                  <li>Marriage and separation details</li>
                  <li>Financial information (only what's necessary for mediation)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Documents You Upload</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Financial documents (bank statements, tax returns, pay stubs)</li>
                  <li>Identification documents</li>
                  <li>Marriage certificates and separation agreements</li>
                  <li>Any other documents you choose to share</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Protect Your Data */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-green-400" />
              <h3 className="text-xl font-semibold text-white">How We Protect Your Data</h3>
            </div>
            <div className="space-y-2 pl-7">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-sm text-green-300 font-medium mb-2">🔒 Military-Grade Encryption</p>
                <p className="text-sm text-slate-300">
                  All your data is encrypted in transit (TLS/SSL) and at rest (AES-256). Even we cannot 
                  read your documents without proper authorization.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Secure, encrypted database storage</li>
                <li>Regular security audits and updates</li>
                <li>Two-factor authentication available</li>
                <li>Access controls and audit logs</li>
                <li>SOC 2 Type II certified infrastructure</li>
              </ul>
            </div>
          </section>

          {/* Who Can See Your Information */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Who Can See Your Information</h3>
            </div>
            <div className="space-y-2 pl-7">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300 font-medium mb-2">✅ Only Authorized Parties</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                  <li><strong>Your assigned mediator</strong> - to facilitate your case</li>
                  <li><strong>You and your spouse/partner</strong> - as participants in the case</li>
                  <li><strong>Your lawyers</strong> - if they're involved in your case</li>
                  <li><strong>Platform administrators</strong> - only for technical support (with your consent)</li>
                </ul>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-300 font-medium mb-2">❌ Who CANNOT See Your Data</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                  <li>Other users on the platform</li>
                  <li>Third-party advertisers (we don't sell your data!)</li>
                  <li>Anyone outside your specific case</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3">Your Rights</h3>
            <div className="space-y-2 pl-4">
              <p className="text-sm">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Access all your personal data at any time</li>
                <li>Request corrections to inaccurate information</li>
                <li>Download your data (data portability)</li>
                <li>Request deletion of your account and data</li>
                <li>Withdraw consent at any time</li>
                <li>File a complaint with data protection authorities</li>
              </ul>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3">Data Retention</h3>
            <div className="pl-4">
              <p className="text-sm leading-relaxed">
                We retain your data for as long as your case is active, plus 7 years after closure 
                (as required by law for legal proceedings). After that, we permanently delete your 
                information unless you request earlier deletion.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Questions About Privacy?</h3>
            <p className="text-sm mb-3">
              We're here to help. Contact our privacy team:
            </p>
            <div className="space-y-1 text-sm">
              <p>📧 Email: <span className="text-teal-400">privacy@mediationplatform.com</span></p>
              <p>📞 Phone: <span className="text-teal-400">1-800-PRIVACY</span></p>
              <p>📍 Address: 123 Privacy Lane, Secure City, SC 12345</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
