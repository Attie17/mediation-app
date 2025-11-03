import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';
import { Plus, Trash2, CreditCard, Home as HomeIcon, Car, Building, TrendingDown, CheckCircle } from 'lucide-react';

const LIABILITY_CATEGORIES = [
  { id: 'credit_cards', label: 'Credit Cards', icon: CreditCard, color: 'red' },
  { id: 'home_loans', label: 'Home Loans/Mortgages', icon: HomeIcon, color: 'orange' },
  { id: 'vehicle_loans', label: 'Vehicle Finance', icon: Car, color: 'yellow' },
  { id: 'personal_loans', label: 'Personal Loans', icon: Building, color: 'purple' },
  { id: 'other', label: 'Other Debts', icon: TrendingDown, color: 'pink' }
];

export default function LiabilitiesDeclarationForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [liabilities, setLiabilities] = useState({
    credit_cards: [],
    home_loans: [],
    vehicle_loans: [],
    personal_loans: [],
    other: []
  });

  useEffect(() => {
    // Load existing liabilities if available
    const fetchLiabilities = async () => {
      try {
        const response = await apiFetch('/api/users/profile');
        if (response.profileDetails?.liabilities) {
          setLiabilities(response.profileDetails.liabilities);
        }
      } catch (err) {
        console.error('Failed to load existing liabilities:', err);
      }
    };
    fetchLiabilities();
  }, []);

  const addLiability = (category) => {
    setLiabilities(prev => ({
      ...prev,
      [category]: [...prev[category], {
        creditor: '',
        accountNumber: '',
        outstandingBalance: '',
        monthlyPayment: '',
        notes: ''
      }]
    }));
  };

  const removeLiability = (category, index) => {
    setLiabilities(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const updateLiability = (category, index, field, value) => {
    setLiabilities(prev => ({
      ...prev,
      [category]: prev[category].map((liability, i) => 
        i === index ? { ...liability, [field]: value } : liability
      )
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    Object.values(liabilities).forEach(categoryLiabilities => {
      categoryLiabilities.forEach(liability => {
        const value = parseFloat(liability.outstandingBalance?.replace(/[^\d.-]/g, '')) || 0;
        total += value;
      });
    });
    return total;
  };

  const calculateMonthlyTotal = () => {
    let total = 0;
    Object.values(liabilities).forEach(categoryLiabilities => {
      categoryLiabilities.forEach(liability => {
        const value = parseFloat(liability.monthlyPayment?.replace(/[^\d.-]/g, '')) || 0;
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

      // Update profile with liabilities
      const payload = {
        name: user?.name,
        role: user?.role || 'divorcee',
        profileDetails: {
          ...existingDetails,
          liabilities,
          liabilitiesTotal: calculateTotal(),
          liabilitiesMonthlyTotal: calculateMonthlyTotal(),
          liabilitiesSubmittedAt: new Date().toISOString()
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
      setError(err.message || 'Failed to save liabilities');
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

  const totalDebt = calculateTotal();
  const monthlyTotal = calculateMonthlyTotal();

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Liabilities Saved Successfully!</h2>
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 mb-4 text-3xl">
            📋
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Liabilities & Debts Declaration
          </h1>
          <p className="text-slate-400">
            List all debts, loans, and financial obligations
          </p>
        </div>

        {/* Total Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl shadow-xl">
            <div className="text-center">
              <p className="text-red-100 text-sm mb-1">Total Outstanding Debt</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(totalDebt.toString())}
              </p>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl shadow-xl">
            <div className="text-center">
              <p className="text-orange-100 text-sm mb-1">Total Monthly Payments</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(monthlyTotal.toString())}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {LIABILITY_CATEGORIES.map(category => {
            const Icon = category.icon;
            const categoryLiabilities = liabilities[category.id] || [];

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
                        {categoryLiabilities.length} {categoryLiabilities.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addLiability(category.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {/* Liability Items */}
                {categoryLiabilities.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>No {category.label.toLowerCase()} added yet</p>
                    <p className="text-sm mt-1">Click "Add" to add an item</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categoryLiabilities.map((liability, index) => (
                      <div key={index} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Creditor/Institution *
                            </label>
                            <input
                              type="text"
                              value={liability.creditor}
                              onChange={(e) => updateLiability(category.id, index, 'creditor', e.target.value)}
                              required
                              placeholder="E.g., ABC Bank, XYZ Credit Card"
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Account/Reference Number
                            </label>
                            <input
                              type="text"
                              value={liability.accountNumber}
                              onChange={(e) => updateLiability(category.id, index, 'accountNumber', e.target.value)}
                              placeholder="Last 4 digits or reference"
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Outstanding Balance (R) *
                            </label>
                            <input
                              type="text"
                              value={liability.outstandingBalance}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, '');
                                updateLiability(category.id, index, 'outstandingBalance', value);
                              }}
                              required
                              placeholder="0"
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {liability.outstandingBalance && (
                              <p className="text-xs text-red-400 mt-1">
                                {formatCurrency(liability.outstandingBalance)}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Monthly Payment (R)
                            </label>
                            <input
                              type="text"
                              value={liability.monthlyPayment}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, '');
                                updateLiability(category.id, index, 'monthlyPayment', value);
                              }}
                              placeholder="0"
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {liability.monthlyPayment && (
                              <p className="text-xs text-orange-400 mt-1">
                                {formatCurrency(liability.monthlyPayment)}
                              </p>
                            )}
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Additional Notes (optional)
                            </label>
                            <textarea
                              value={liability.notes}
                              onChange={(e) => updateLiability(category.id, index, 'notes', e.target.value)}
                              rows={2}
                              placeholder="Payment terms, co-signers, or other relevant details..."
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <button
                              type="button"
                              onClick={() => removeLiability(category.id, index)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
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
              className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Submit Liabilities Declaration'}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>Include all debts such as credit cards, loans, mortgages, and any other financial obligations.</p>
          <p className="mt-2">You can come back and update this information at any time.</p>
        </div>

      </div>
    </div>
  );
}
