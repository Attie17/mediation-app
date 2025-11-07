import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';
import { Plus, Trash2, Home, Car, Briefcase, PiggyBank, Landmark, CheckCircle } from 'lucide-react';

const ASSET_CATEGORIES = [
  { id: 'property', label: 'Property/Real Estate', icon: Home, color: 'blue' },
  { id: 'vehicles', label: 'Vehicles', icon: Car, color: 'purple' },
  { id: 'investments', label: 'Investments', icon: Briefcase, color: 'green' },
  { id: 'savings', label: 'Savings/Cash', icon: PiggyBank, color: 'yellow' },
  { id: 'other', label: 'Other Assets', icon: Landmark, color: 'pink' }
];

export default function AssetsDeclarationForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [assets, setAssets] = useState({
    property: [],
    vehicles: [],
    investments: [],
    savings: [],
    other: []
  });

  useEffect(() => {
    // Load existing assets if available
    const fetchAssets = async () => {
      try {
        const response = await apiFetch('/api/users/profile');
        if (response.profileDetails?.assets) {
          setAssets(response.profileDetails.assets);
        }
      } catch (err) {
        console.error('Failed to load existing assets:', err);
      }
    };
    fetchAssets();
  }, []);

  const addAsset = (category) => {
    setAssets(prev => ({
      ...prev,
      [category]: [...prev[category], {
        description: '',
        estimatedValue: '',
        notes: ''
      }]
    }));
  };

  const removeAsset = (category, index) => {
    setAssets(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const updateAsset = (category, index, field, value) => {
    setAssets(prev => ({
      ...prev,
      [category]: prev[category].map((asset, i) => 
        i === index ? { ...asset, [field]: value } : asset
      )
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    Object.values(assets).forEach(categoryAssets => {
      categoryAssets.forEach(asset => {
        const value = parseFloat(asset.estimatedValue?.replace(/[^\d.-]/g, '')) || 0;
        total += value;
      });
    });
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('You must be logged in. Please sign in first.');
        setLoading(false);
        return;
      }

      // Get existing profile details
      const profileResponse = await apiFetch('/api/users/profile');
      const existingDetails = profileResponse.profileDetails || {};

      // Update profile with assets
      const payload = {
        name: user?.name,
        role: user?.role || 'divorcee',
        profileDetails: {
          ...existingDetails,
          assets,
          assetsTotal: calculateTotal(),
          assetsSubmittedAt: new Date().toISOString()
        }
      };

      await apiFetch('/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/divorcee');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to save assets');
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value?.replace(/[^\d.-]/g, '')) || 0;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const totalValue = calculateTotal();

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Assets Saved Successfully!</h2>
          <p className="text-slate-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4 text-3xl">
            💰
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Assets Declaration
          </h1>
          <p className="text-slate-400">
            List all assets you own or have an interest in
          </p>
        </div>

        {/* Total Banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl">
          <div className="text-center">
            <p className="text-green-100 text-sm mb-1">Total Estimated Value</p>
            <p className="text-4xl font-bold text-white">
              {formatCurrency(totalValue.toString())}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {ASSET_CATEGORIES.map(category => {
            const Icon = category.icon;
            const categoryAssets = assets[category.id] || [];

            return (
              <div key={category.id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6">
                
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${category.color}-500/20`}>
                      <Icon className={`w-6 h-6 text-${category.color}-400`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{category.label}</h2>
                      <p className="text-sm text-slate-400">
                        {categoryAssets.length} {categoryAssets.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addAsset(category.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {/* Asset Items */}
                {categoryAssets.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>No {category.label.toLowerCase()} added yet</p>
                    <p className="text-sm mt-1">Click "Add" to add an item</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categoryAssets.map((asset, index) => (
                      <div key={index} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Description *
                            </label>
                            <input
                              type="text"
                              value={asset.description}
                              onChange={(e) => updateAsset(category.id, index, 'description', e.target.value)}
                              required
                              placeholder="E.g., House at 123 Main St, 2015 Toyota Corolla, etc."
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Estimated Value (R) *
                            </label>
                            <input
                              type="text"
                              value={asset.estimatedValue}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, '');
                                updateAsset(category.id, index, 'estimatedValue', value);
                              }}
                              required
                              placeholder="0"
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {asset.estimatedValue && (
                              <p className="text-xs text-green-400 mt-1">
                                {formatCurrency(asset.estimatedValue)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeAsset(category.id, index)}
                              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Additional Notes (optional)
                            </label>
                            <textarea
                              value={asset.notes}
                              onChange={(e) => updateAsset(category.id, index, 'notes', e.target.value)}
                              rows={2}
                              placeholder="Any additional details about this asset..."
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/divorcee')}
              className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Save for Later
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Submit Assets Declaration'}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>Include all assets such as property, vehicles, investments, bank accounts, and personal property.</p>
          <p className="mt-2">You can come back and update this information at any time.</p>
        </div>

      </div>
    </div>
  );
}
