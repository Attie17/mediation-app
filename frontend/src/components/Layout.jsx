import React from "react";
import { Outlet } from "react-router-dom";
import { getRandomMessage } from "../utils/messages";

// Temporary auth mock (replace with Supabase later)
const isAuthenticated = true; // set false to preview logged-out view
const userName = "Attie";
const userRole = "mediator";
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
const greeting = getGreeting();

export default function Layout() {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#0F172A] to-[#1E3A8A]">
      <div className="flex w-11/12 max-w-6xl bg-blue-900/40 rounded-xl shadow-lg overflow-hidden">
        {/* LEFT panel → image */}
        <div className="flex-1 flex justify-center items-center bg-blue-800/40">
          <img
            src="/images/accord-landing.jpg"
            alt="Mediation meeting"
            className="rounded-lg shadow-lg object-cover w-4/5 h-4/5"
          />
        </div>

        {/* RIGHT panel → Accord branding, tagline, buttons/greeting */}
        <div className="flex-1 p-10 flex flex-col justify-center items-center text-center">
          <h1 className="text-5xl font-bold">Accord</h1>
          <p className="text-xl text-gray-300 mt-2">Mediation</p>
          <p className="text-lg text-gray-200 mt-2">Fair, guided, confidential resolution.</p>
          <p className="text-gray-300 mt-4 max-w-md">
            In South Africa, Rule 41A requires divorcing spouses to formally consider mediation before
            the courts will hear their case — a requirement now reinforced by Gauteng’s 2025 directive
            that no trial date will be set without a mediator’s report.
          </p>

          {!isAuthenticated ? (
            <div className="flex gap-4 mt-6">
              <button className="px-5 py-2 rounded-full bg-black text-white hover:bg-gray-800">
                Register
              </button>
              <button className="px-5 py-2 rounded-full bg-[#4A90E2] text-white hover:bg-[#357ABD]">
                Sign In
              </button>
            </div>
          ) : (
            <div className="mt-6">
              <h2 className="text-xl font-semibold">{greeting}, {userName}.</h2>
              <p className="italic text-gray-300 mt-2">{getRandomMessage(userRole, userName)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}