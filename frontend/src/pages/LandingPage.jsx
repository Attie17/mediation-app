import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
    <div className="flex flex-col md:flex-row w-full max-w-5xl px-8 py-16">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <h1 className="text-6xl font-extrabold text-blue-100 mb-2 tracking-tight" style={{letterSpacing: '-2px'}}>Accord</h1>
        <h2 className="text-2xl font-semibold text-blue-100 mb-2">Mediation</h2>
        <p className="text-lg text-blue-100 mb-2">Fair, guided, confidential resolution.</p>
        <p className="text-base text-blue-200 mb-8 max-w-xl">In South Africa, Rule 41A requires divorcing spouses to formally consider mediation before the courts will hear their case — a requirement now reinforced by Gauteng’s 2025 directive that no trial date will be set without a mediator’s report.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/register">
            <button className="bg-black text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-gray-800 transition">Register</button>
          </Link>
          <Link to="/signin">
            <button className="bg-blue-400 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-blue-500 transition">Sign In</button>
          </Link>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {/* Placeholder for image or illustration */}
        {/* <img src="/mediation-illustration.svg" alt="Mediation meeting" className="w-96 h-96 object-contain opacity-80" /> */}
      </div>
    </div>
    <footer className="absolute bottom-4 left-0 w-full text-center text-blue-200 text-sm">
      &copy; {new Date().getFullYear()} Accord Mediation. All rights reserved.
    </footer>
  </div>
);

export default LandingPage;
