"use client";

import { useState } from 'react';
import { TrendingUp, DollarSign, Calendar, AlertCircle, Play } from 'lucide-react';
import api from '@/utils/api';

interface Scenario {
  name: string;
  timeHorizon: number;
  assumptions: {
    incomeChange: number;
    expenseChange: number;
    investmentReturn: number;
    inflation: number;
  };
  changes: {
    majorPurchase?: number;
    salaryIncrease?: number;
    newExpense?: number;
  };
}

interface SimulationResult {
  finalBalance: number;
  totalSavings: number;
  totalInvestmentGains: number;
  insights: string[];
  risks: string[];
  projections: Array<{
    month: number;
    balance: number;
    income: number;
    expenses: number;
  }>;
}

export default function ScenarioSimulator() {
  const [scenario, setScenario] = useState<Scenario>({
    name: 'Custom Scenario',
    timeHorizon: 12,
    assumptions: {
      incomeChange: 0,
      expenseChange: 0,
      investmentReturn: 8,
      inflation: 6
    },
    changes: {}
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const response = await api.post('/scenarios/simulate', scenario);
      setResult(response.data);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const presetScenarios = [
    {
      name: 'Job Loss',
      description: 'What if I lose my job for 3 months?',
      config: {
        timeHorizon: 12,
        assumptions: { incomeChange: -100, expenseChange: -20, investmentReturn: 8, inflation: 6 },
        changes: {}
      }
    },
    {
      name: 'Major Purchase',
      description: 'Buying a car worth ₹5,00,000',
      config: {
        timeHorizon: 12,
        assumptions: { incomeChange: 0, expenseChange: 10, investmentReturn: 8, inflation: 6 },
        changes: { majorPurchase: 500000 }
      }
    },
    {
      name: 'Salary Increase',
      description: '20% salary hike next month',
      config: {
        timeHorizon: 12,
        assumptions: { incomeChange: 20, expenseChange: 5, investmentReturn: 8, inflation: 6 },
        changes: { salaryIncrease: 20 }
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Scenario Simulator</h2>
        <p className="text-gray-400 text-sm mt-1">Model financial scenarios and see their impact</p>
      </div>

      {/* Preset Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {presetScenarios.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => setScenario({ ...preset.config, name: preset.name })}
            className="p-4 bg-gray-900 hover:bg-gray-800 rounded-xl border border-white/10 hover:border-indigo-500/50 transition-all text-left"
          >
            <h3 className="text-white font-semibold mb-1">{preset.name}</h3>
            <p className="text-gray-400 text-sm">{preset.description}</p>
          </button>
        ))}
      </div>

      {/* Configuration */}
      <div className="p-6 bg-gray-900 rounded-2xl border border-white/10 space-y-6">
        <h3 className="text-white font-semibold text-lg">Scenario Configuration</h3>

        {/* Scenario Name */}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Scenario Name</label>
          <input
            type="text"
            value={scenario.name}
            onChange={(e) => setScenario({ ...scenario, name: e.target.value })}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Time Horizon */}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Time Horizon (months)</label>
          <input
            type="number"
            value={scenario.timeHorizon}
            onChange={(e) => setScenario({ ...scenario, timeHorizon: parseInt(e.target.value) })}
            min="1"
            max="120"
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Assumptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Income Change (%)</label>
            <input
              type="number"
              value={scenario.assumptions.incomeChange}
              onChange={(e) => setScenario({
                ...scenario,
                assumptions: { ...scenario.assumptions, incomeChange: parseFloat(e.target.value) }
              })}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Expense Change (%)</label>
            <input
              type="number"
              value={scenario.assumptions.expenseChange}
              onChange={(e) => setScenario({
                ...scenario,
                assumptions: { ...scenario.assumptions, expenseChange: parseFloat(e.target.value) }
              })}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Investment Return (%)</label>
            <input
              type="number"
              value={scenario.assumptions.investmentReturn}
              onChange={(e) => setScenario({
                ...scenario,
                assumptions: { ...scenario.assumptions, investmentReturn: parseFloat(e.target.value) }
              })}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Inflation (%)</label>
            <input
              type="number"
              value={scenario.assumptions.inflation}
              onChange={(e) => setScenario({
                ...scenario,
                assumptions: { ...scenario.assumptions, inflation: parseFloat(e.target.value) }
              })}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Major Purchase */}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Major Purchase Amount (₹)</label>
          <input
            type="number"
            value={scenario.changes.majorPurchase || ''}
            onChange={(e) => setScenario({
              ...scenario,
              changes: { ...scenario.changes, majorPurchase: parseFloat(e.target.value) || undefined }
            })}
            placeholder="Optional"
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Simulate Button */}
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {isSimulating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Simulating...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Simulation
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <h3 className="text-white font-semibold text-lg">Simulation Results</h3>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 rounded-2xl border border-indigo-500/20">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-indigo-400" />
                <span className="text-indigo-400 text-sm font-medium">Final Balance</span>
              </div>
              <p className="text-3xl font-bold text-white">₹{result.finalBalance.toLocaleString()}</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-2xl border border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Total Savings</span>
              </div>
              <p className="text-3xl font-bold text-white">₹{result.totalSavings.toLocaleString()}</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-2xl border border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">Investment Gains</span>
              </div>
              <p className="text-3xl font-bold text-white">₹{result.totalInvestmentGains.toLocaleString()}</p>
            </div>
          </div>

          {/* Insights */}
          {result.insights.length > 0 && (
            <div className="p-6 bg-gray-900 rounded-2xl border border-white/10">
              <h4 className="text-white font-semibold mb-4">Key Insights</h4>
              <ul className="space-y-2">
                {result.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {result.risks.length > 0 && (
            <div className="p-6 bg-red-900/10 rounded-2xl border border-red-500/20">
              <h4 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Potential Risks
              </h4>
              <ul className="space-y-2">
                {result.risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
