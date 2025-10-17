import React from "react";

export default function WhatToExpect() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">What to Expect</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Step-by-step Guidance</h2>
          <p>Our platform will guide you through each stage of the mediation process, from case creation to resolution. You will receive notifications and support at every step.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Support from Professionals</h2>
          <p>Mediators and legal professionals are available to answer your questions and help resolve disputes fairly and efficiently.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Confidentiality</h2>
          <p>Your privacy is our priority. All communications and documents are protected and handled with care.</p>
        </div>
      </div>
    </div>
  );
}
