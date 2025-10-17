import React from "react";

export default function HomeLayout() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a174e] to-[#2463eb] flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
        {/* Left Card */}
        <div className="rounded-2xl bg-blue-900 bg-opacity-70 shadow-xl p-10 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Left Frame</h2>
          <p className="text-lg text-blue-100 mb-2">This is the left panel. Add Accord branding, Register/Sign In here.</p>
        </div>
        {/* Right Card */}
        <div className="rounded-2xl bg-blue-900 bg-opacity-70 shadow-xl p-10 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Right Frame</h2>
          <p className="text-lg text-blue-100 mb-2">This is the right panel. It can hold dynamic content later.</p>
        </div>
      </div>
    </div>
  );
}
