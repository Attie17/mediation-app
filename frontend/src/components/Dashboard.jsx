import React, { useEffect, useState } from 'react';
import config from '../config';

const API_BASE_URL = config.api.baseUrl;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      setError('No user ID found. Please log in.');
      setLoading(false);
      return;
    }
  fetch(`${API_BASE_URL}/dashboard/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <div className="text-red-600 font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="mb-4">
        <span className="font-semibold">Email:</span> {data?.email || 'N/A'}
      </div>
      <div className="flex gap-4 mb-6">
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
          Intake Count: {data?.intakeCount ?? 0}
        </div>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
          Uploads Count: {data?.uploadsCount ?? 0}
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2">Latest Intake</h3>
        {data?.latestIntake ? (
          <div className="bg-gray-50 p-4 rounded mb-2">
            <div className="mb-1">
              <span className="font-semibold">Step:</span> {data.latestIntake.step}
            </div>
            <div>
              <span className="font-semibold">Answers:</span> {Array.isArray(data.latestIntake.answers) ? data.latestIntake.answers.join(', ') : data.latestIntake.answers}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No intake answers yet</div>
        )}
      </div>
      <div>
        <h3 className="text-lg font-bold mb-2">Latest Upload</h3>
        {data?.latestUpload ? (
          <div className="bg-gray-50 p-4 rounded mb-2">
            <div className="mb-1">
              <span className="font-semibold">File Name:</span> {data.latestUpload.file_name}
            </div>
            <div>
              <span className="font-semibold">Privacy Tier:</span> {data.latestUpload.privacy_tier}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No uploads yet</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
