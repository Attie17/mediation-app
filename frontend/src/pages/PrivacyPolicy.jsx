import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Your Data</h2>
          <p>We are committed to protecting your personal information. All data is encrypted and stored securely. Only authorized users can access your case details and documents.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Document Security</h2>
          <p>Uploaded documents are stored in a secure environment and are only accessible to you, your mediator, and authorized legal professionals.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p>If you have any questions about privacy or data protection, please contact our support team.</p>
        </div>
      </div>
    </div>
  );
}
