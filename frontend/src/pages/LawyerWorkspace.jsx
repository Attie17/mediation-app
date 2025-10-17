import React from 'react';

export default function LawyerWorkspace() {
  const rows = [
    { id: 'CASE-001', parties: 'A vs B', status: 'Mediation' },
    { id: 'CASE-002', parties: 'C vs D', status: 'Awaiting docs' },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 md:p-12 text-white">
      <div className="w-full max-w-2xl">
  <h3 className="text-2xl font-bold mb-4">Lawyer Dashboard</h3>
        <div className="bg-blue-700/60 rounded-xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-blue-700/80">
              <tr>
                <th className="px-4 py-3">Case</th>
                <th className="px-4 py-3">Parties</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="odd:bg-blue-700/40 even:bg-blue-700/20">
                  <td className="px-4 py-2">{r.id}</td>
                  <td className="px-4 py-2">{r.parties}</td>
                  <td className="px-4 py-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
