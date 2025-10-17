import React from "react";

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">How do I start a mediation case?</h2>
          <p>To start a mediation case, register or sign in, then follow the dashboard prompts to create a new case. You will be guided through the process step by step.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Who will be my mediator?</h2>
          <p>Your mediator will be assigned based on your case type and location. You can view mediator details in your case dashboard.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Is my information private?</h2>
          <p>Yes, all case information and documents are securely stored and only accessible to authorized parties.</p>
        </div>
      </div>
    </div>
  );
}
