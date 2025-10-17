import React, { useEffect, useState } from 'react';
import supabase from '../supabaseClient';

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test the connection by trying to query the notifications table
        const { data, error } = await supabase
          .from('notifications')
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          setError(error.message);
          setConnectionStatus('Connection failed');
        } else {
          setConnectionStatus('✅ Connected to Supabase successfully!');
        }
      } catch (err) {
        setError(err.message);
        setConnectionStatus('Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto mt-8">
      <h3 className="text-lg font-semibold mb-4">Supabase Connection Test</h3>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`text-sm font-medium ${
            connectionStatus.includes('✅') ? 'text-green-600' : 
            connectionStatus === 'Testing...' ? 'text-blue-600' : 'text-red-600'
          }`}>
            {connectionStatus}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">URL:</span>
          <span className="text-sm font-mono text-gray-800">
            {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Anon Key:</span>
          <span className="text-sm font-mono text-gray-800">
            {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configured ✓' : 'Not configured'}
          </span>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
            <p className="text-red-800 text-sm font-medium">Error:</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseTest;