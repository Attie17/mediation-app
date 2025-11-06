import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Users, TrendingUp, Info, Plus, Minus } from 'lucide-react';

/**
 * FinancialCalculator Component
 * Implements SA Maintenance Act calculations for child/spousal support
 * Based on South African Family Law and Maintenance Act 99 of 1998
 */
export default function FinancialCalculator({ initialData = {}, onCalculationComplete }) {
  const [scenario, setScenario] = useState(initialData.scenario || 1);
  const [showDetails, setShowDetails] = useState(false);

  // Scenario 1: My Financial Information
  const [myIncome, setMyIncome] = useState(initialData.myIncome || '');
  const [myExpenses, setMyExpenses] = useState(initialData.myExpenses || '');
  const [myChildExpenses, setMyChildExpenses] = useState(initialData.myChildExpenses || '');

  // Scenario 2: Partner's Financial Information
  const [partnerIncome, setPartnerIncome] = useState(initialData.partnerIncome || '');
  const [partnerExpenses, setPartnerExpenses] = useState(initialData.partnerExpenses || '');
  const [partnerChildExpenses, setPartnerChildExpenses] = useState(initialData.partnerChildExpenses || '');

  // Additional Context
  const [numberOfChildren, setNumberOfChildren] = useState(initialData.numberOfChildren || 1);
  const [custodyArrangement, setCustodyArrangement] = useState(initialData.custodyArrangement || 'primary_me');
  const [childAges, setChildAges] = useState(initialData.childAges || ['0']);

  // Detailed Child Expenses
  const [detailedExpenses, setDetailedExpenses] = useState({
    education: initialData.detailedExpenses?.education || 0,
    medical: initialData.detailedExpenses?.medical || 0,
    extracurricular: initialData.detailedExpenses?.extracurricular || 0,
    clothing: initialData.detailedExpenses?.clothing || 0,
    food: initialData.detailedExpenses?.food || 0,
    transport: initialData.detailedExpenses?.transport || 0,
  });

  // Calculate total detailed expenses
  const totalDetailedExpenses = Object.values(detailedExpenses).reduce((sum, val) => sum + Number(val), 0);

  /**
   * Calculate child support using SA Maintenance Act guidelines
   * Formula: Base = 40% of gross income per child
   * Adjusted for multiple children, custody arrangements, and income disparity
   */
  const calculateChildSupport = () => {
    const myIncomeNum = parseFloat(myIncome) || 0;
    const partnerIncomeNum = parseFloat(partnerIncome) || 0;
    const totalIncome = myIncomeNum + partnerIncomeNum;

    if (totalIncome === 0) return { myObligation: 0, partnerObligation: 0, totalRequired: 0 };

    // Base calculation: 40% of gross income for first child
    let basePercentage = 0.40;

    // Adjust for multiple children (reduce by 10% per additional child)
    if (numberOfChildren > 1) {
      basePercentage = basePercentage - (0.10 * (numberOfChildren - 1));
      basePercentage = Math.max(basePercentage, 0.20); // Minimum 20%
    }

    // Calculate proportional obligations based on income ratio
    const myProportion = totalIncome > 0 ? myIncomeNum / totalIncome : 0.5;
    const partnerProportion = totalIncome > 0 ? partnerIncomeNum / totalIncome : 0.5;

    // Determine actual child costs (use detailed if provided, otherwise estimate)
    const actualChildCosts = totalDetailedExpenses > 0 
      ? totalDetailedExpenses 
      : (parseFloat(myChildExpenses) || 0) + (parseFloat(partnerChildExpenses) || 0);

    // Calculate baseline from income percentage
    const estimatedCosts = totalIncome * basePercentage;

    // Use the higher of actual costs or income-based estimate
    const totalRequired = Math.max(actualChildCosts, estimatedCosts);

    // Adjust based on custody arrangement
    let myObligation, partnerObligation;

    switch (custodyArrangement) {
      case 'primary_me':
        // Partner pays proportional share
        partnerObligation = totalRequired * partnerProportion;
        myObligation = 0; // Primary caregiver receives support
        break;
      case 'primary_partner':
        // I pay proportional share
        myObligation = totalRequired * myProportion;
        partnerObligation = 0; // Partner receives support
        break;
      case 'shared_50_50':
        // Both contribute proportionally to their incomes
        myObligation = totalRequired * myProportion;
        partnerObligation = totalRequired * partnerProportion;
        break;
      case 'shared_60_40_me':
        // I have 60% custody, partner pays more
        partnerObligation = totalRequired * partnerProportion * 0.6;
        myObligation = totalRequired * myProportion * 0.4;
        break;
      case 'shared_60_40_partner':
        // Partner has 60% custody, I pay more
        myObligation = totalRequired * myProportion * 0.6;
        partnerObligation = totalRequired * partnerProportion * 0.4;
        break;
      default:
        myObligation = totalRequired * myProportion;
        partnerObligation = totalRequired * partnerProportion;
    }

    return {
      myObligation: Math.round(myObligation),
      partnerObligation: Math.round(partnerObligation),
      totalRequired: Math.round(totalRequired),
      basePercentage: (basePercentage * 100).toFixed(0),
      myProportion: (myProportion * 100).toFixed(0),
      partnerProportion: (partnerProportion * 100).toFixed(0)
    };
  };

  /**
   * Calculate spousal maintenance
   * Considers: Income disparity, length of marriage, standard of living
   * SA Law: No automatic right, but court considers need vs ability to pay
   */
  const calculateSpousalMaintenance = () => {
    const myIncomeNum = parseFloat(myIncome) || 0;
    const partnerIncomeNum = parseFloat(partnerIncome) || 0;
    const myExpensesNum = parseFloat(myExpenses) || 0;
    const partnerExpensesNum = parseFloat(partnerExpenses) || 0;

    // Calculate income disparity
    const incomeDifference = Math.abs(myIncomeNum - partnerIncomeNum);
    const higherIncome = Math.max(myIncomeNum, partnerIncomeNum);

    if (higherIncome === 0) return { paymentAmount: 0, direction: 'neither', likelihood: 'low' };

    // Determine who has surplus income
    const mySurplus = myIncomeNum - myExpensesNum;
    const partnerSurplus = partnerIncomeNum - partnerExpensesNum;

    // Check if there's a significant disparity (>40%)
    const disparityPercent = (incomeDifference / higherIncome) * 100;

    if (disparityPercent < 20) {
      return { 
        paymentAmount: 0, 
        direction: 'neither', 
        likelihood: 'low',
        reason: 'Income levels are relatively equal'
      };
    }

    // Determine who pays whom
    let direction, paymentAmount, likelihood, reason;

    if (myIncomeNum > partnerIncomeNum) {
      // I earn more - might pay partner
      if (mySurplus > 0 && partnerSurplus < 0) {
        // I have surplus, partner has shortfall
        paymentAmount = Math.min(Math.abs(partnerSurplus), mySurplus * 0.3); // Max 30% of my surplus
        direction = 'i_pay_partner';
        likelihood = disparityPercent > 40 ? 'high' : 'moderate';
        reason = 'Significant income disparity and partner has financial need';
      } else {
        paymentAmount = incomeDifference * 0.15; // Modest support
        direction = 'i_pay_partner';
        likelihood = 'low';
        reason = 'Income disparity exists but partner may be self-sufficient';
      }
    } else {
      // Partner earns more - might pay me
      if (partnerSurplus > 0 && mySurplus < 0) {
        // Partner has surplus, I have shortfall
        paymentAmount = Math.min(Math.abs(mySurplus), partnerSurplus * 0.3);
        direction = 'partner_pays_me';
        likelihood = disparityPercent > 40 ? 'high' : 'moderate';
        reason = 'Significant income disparity and I have financial need';
      } else {
        paymentAmount = incomeDifference * 0.15;
        direction = 'partner_pays_me';
        likelihood = 'low';
        reason = 'Income disparity exists but I may be self-sufficient';
      }
    }

    return {
      paymentAmount: Math.round(paymentAmount),
      direction,
      likelihood,
      reason,
      disparityPercent: Math.round(disparityPercent)
    };
  };

  const childSupport = calculateChildSupport();
  const spousalMaintenance = calculateSpousalMaintenance();

  // Calculate net financial position
  const calculateNetPosition = () => {
    let myNetPosition = 0;

    // Child support impact
    if (custodyArrangement === 'primary_me') {
      myNetPosition += childSupport.partnerObligation; // I receive
    } else if (custodyArrangement === 'primary_partner') {
      myNetPosition -= childSupport.myObligation; // I pay
    } else {
      myNetPosition = childSupport.partnerObligation - childSupport.myObligation;
    }

    // Spousal maintenance impact
    if (spousalMaintenance.direction === 'i_pay_partner') {
      myNetPosition -= spousalMaintenance.paymentAmount;
    } else if (spousalMaintenance.direction === 'partner_pays_me') {
      myNetPosition += spousalMaintenance.paymentAmount;
    }

    return Math.round(myNetPosition);
  };

  const netPosition = calculateNetPosition();

  // Save calculation when values change
  useEffect(() => {
    if (onCalculationComplete) {
      onCalculationComplete({
        scenario,
        myIncome,
        myExpenses,
        myChildExpenses,
        partnerIncome,
        partnerExpenses,
        partnerChildExpenses,
        numberOfChildren,
        custodyArrangement,
        childAges,
        detailedExpenses,
        calculations: {
          childSupport,
          spousalMaintenance,
          netPosition
        }
      });
    }
  }, [
    myIncome, myExpenses, myChildExpenses, partnerIncome, partnerExpenses, 
    partnerChildExpenses, numberOfChildren, custodyArrangement, childAges, detailedExpenses
  ]);

  const handleExpenseChange = (category, value) => {
    setDetailedExpenses(prev => ({
      ...prev,
      [category]: parseFloat(value) || 0
    }));
  };

  const addChildAge = () => {
    setChildAges([...childAges, '0']);
    setNumberOfChildren(numberOfChildren + 1);
  };

  const removeChildAge = (index) => {
    const newAges = childAges.filter((_, i) => i !== index);
    setChildAges(newAges);
    setNumberOfChildren(Math.max(1, numberOfChildren - 1));
  };

  const updateChildAge = (index, value) => {
    const newAges = [...childAges];
    newAges[index] = value;
    setChildAges(newAges);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
        <div className="p-3 bg-green-500/20 rounded-lg">
          <Calculator className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Financial Calculator</h3>
          <p className="text-sm text-slate-400">Based on SA Maintenance Act 99 of 1998</p>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setScenario(1)}
          className={`p-4 rounded-lg border transition-all ${
            scenario === 1
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
          }`}
        >
          <div className="text-sm font-medium">Scenario 1</div>
          <div className="text-xs mt-1">Current Estimates</div>
        </button>
        <button
          onClick={() => setScenario(2)}
          className={`p-4 rounded-lg border transition-all ${
            scenario === 2
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
          }`}
        >
          <div className="text-sm font-medium">Scenario 2</div>
          <div className="text-xs mt-1">Alternative</div>
        </button>
        <button
          onClick={() => setScenario(3)}
          className={`p-4 rounded-lg border transition-all ${
            scenario === 3
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
          }`}
        >
          <div className="text-sm font-medium">Scenario 3</div>
          <div className="text-xs mt-1">Best Case</div>
        </button>
      </div>

      {/* Income & Expenses Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Finances */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            My Finances
          </h4>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Monthly Gross Income (R)</label>
            <input
              type="number"
              value={myIncome}
              onChange={(e) => setMyIncome(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Monthly Expenses (R)</label>
            <input
              type="number"
              value={myExpenses}
              onChange={(e) => setMyExpenses(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Child-Related Expenses (R)</label>
            <input
              type="number"
              value={myChildExpenses}
              onChange={(e) => setMyChildExpenses(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Partner's Finances */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            Partner's Finances
          </h4>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Monthly Gross Income (R)</label>
            <input
              type="number"
              value={partnerIncome}
              onChange={(e) => setPartnerIncome(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Monthly Expenses (R)</label>
            <input
              type="number"
              value={partnerExpenses}
              onChange={(e) => setPartnerExpenses(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Child-Related Expenses (R)</label>
            <input
              type="number"
              value={partnerChildExpenses}
              onChange={(e) => setPartnerChildExpenses(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Children Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Children & Custody
        </h4>
        
        {/* Child Ages */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Children's Ages</label>
          <div className="space-y-2">
            {childAges.map((age, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => updateChildAge(index, e.target.value)}
                  placeholder="Age"
                  min="0"
                  max="21"
                  className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {childAges.length > 1 && (
                  <button
                    onClick={() => removeChildAge(index)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addChildAge}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Another Child</span>
            </button>
          </div>
        </div>

        {/* Custody Arrangement */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Proposed Custody Arrangement</label>
          <select
            value={custodyArrangement}
            onChange={(e) => setCustodyArrangement(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="primary_me">Primary custody with me</option>
            <option value="primary_partner">Primary custody with partner</option>
            <option value="shared_50_50">Shared 50/50</option>
            <option value="shared_60_40_me">Shared 60/40 (me primary)</option>
            <option value="shared_60_40_partner">Shared 60/40 (partner primary)</option>
          </select>
        </div>
      </div>

      {/* Detailed Child Expenses (Optional) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span>Detailed Child Expenses (Optional - for more accurate calculations)</span>
        </summary>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 pl-6">
          {Object.entries({
            education: 'School fees & supplies',
            medical: 'Medical & healthcare',
            extracurricular: 'Sports & activities',
            clothing: 'Clothing & shoes',
            food: 'Food & groceries',
            transport: 'Transport & travel'
          }).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input
                type="number"
                value={detailedExpenses[key]}
                onChange={(e) => handleExpenseChange(key, e.target.value)}
                placeholder="R 0"
                className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          ))}
        </div>
        {totalDetailedExpenses > 0 && (
          <div className="mt-3 pl-6 text-sm text-slate-300">
            Total detailed expenses: <span className="font-semibold text-green-400">R {totalDetailedExpenses.toLocaleString()}</span>
          </div>
        )}
      </details>

      {/* Results Panel */}
      <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-6 border border-slate-600 space-y-6">
        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Calculation Results
        </h4>

        {/* Child Support */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Child Support (Total Required)</span>
            <span className="text-xl font-bold text-white">R {childSupport.totalRequired.toLocaleString()}/mo</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-slate-400 mb-1">I contribute</div>
              <div className="text-lg font-semibold text-green-400">R {childSupport.myObligation.toLocaleString()}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-slate-400 mb-1">Partner contributes</div>
              <div className="text-lg font-semibold text-blue-400">R {childSupport.partnerObligation.toLocaleString()}</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Based on {childSupport.basePercentage}% income guideline • My share: {childSupport.myProportion}% • Partner's share: {childSupport.partnerProportion}%
          </div>
        </div>

        {/* Spousal Maintenance */}
        <div className="space-y-3 pt-4 border-t border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Spousal Maintenance</span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${
                spousalMaintenance.paymentAmount > 0 
                  ? spousalMaintenance.direction === 'i_pay_partner' ? 'text-red-400' : 'text-green-400'
                  : 'text-slate-500'
              }`}>
                R {spousalMaintenance.paymentAmount.toLocaleString()}/mo
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                spousalMaintenance.likelihood === 'high' 
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : spousalMaintenance.likelihood === 'moderate'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-600/50 text-slate-400 border border-slate-600'
              }`}>
                {spousalMaintenance.likelihood} likelihood
              </span>
            </div>
          </div>
          {spousalMaintenance.paymentAmount > 0 && (
            <>
              <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
                <div className="text-slate-300">
                  {spousalMaintenance.direction === 'i_pay_partner' 
                    ? '→ I would pay partner'
                    : '← Partner would pay me'}
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {spousalMaintenance.reason} • Income disparity: {spousalMaintenance.disparityPercent}%
              </div>
            </>
          )}
          {spousalMaintenance.paymentAmount === 0 && (
            <div className="text-xs text-slate-400">{spousalMaintenance.reason}</div>
          )}
        </div>

        {/* Net Financial Position */}
        <div className="pt-4 border-t border-slate-600">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">My Net Monthly Position</span>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  netPosition > 0 ? 'text-green-400' : netPosition < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {netPosition > 0 ? '+' : ''}R {Math.abs(netPosition).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {netPosition > 0 ? 'I receive' : netPosition < 0 ? 'I pay' : 'Balanced'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
          <p className="text-xs text-yellow-300">
            <strong>Disclaimer:</strong> These calculations are estimates based on SA Maintenance Act guidelines. 
            Actual court determinations consider additional factors including: length of marriage, earning capacity, 
            standard of living during marriage, and specific needs of children. Consult a family law attorney for personalized advice.
          </p>
        </div>
      </div>
    </div>
  );
}
