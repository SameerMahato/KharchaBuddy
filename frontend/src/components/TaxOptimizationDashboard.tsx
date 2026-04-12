"use client";

import { useState, useEffect } from 'react';
import { FileText, TrendingDown, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import api from '@/utils/api';

interface TaxAnalysis {
  financialYear: string;
  estimatedIncome: number;
  currentDeductions: any[];
  potentialSavings: number;
  recommendations: TaxRecommendation[];
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
}

interface TaxRecommendation {
  section: string;
  suggestion: string;
  potentialSaving: number;
  deadline?: string;
}

interface Section80C {
  totalLimit: number;
  utilized: number;
  remaining: number;
  suggestions: any[];
}

export default function TaxOptimizationDashboard() {
  const [analysis, setAnalysis] = useState<TaxAnalysis | null>(null);
  const [section80C, setSection80C] = useState<Section80C | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTaxData();
  }, []);

  const fetchTaxData = async () => {
    try {
      const [analysisRes, section80CRes] = await Promise.all([
        api.get('/tax/analysis'),
        api.get('/tax/section-80c')
      ]);
      
      setAnalysis(analysisRes.data);
      setSection80C(section80CRes.data);
    } catch (error) {
      console.error('Failed to fetch tax data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-400 bg-green-500/10';
      case 'at_risk': return 'text-yellow-400 bg-yellow-500/10';
      case 'non_compliant': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-5 h-5" />;
      case 'at_risk': return <AlertTriangle className="w-5 h-5" />;
      case 'non_compliant': return <AlertTriangle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12 bg-gray-900 rounded-2xl border border-white/10">
        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-2">No tax data available</h3>
        <p className="text-gray-400 text-sm">Start tracking your income and deductions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Tax Optimization</h2>
        <p className="text-gray-400 text-sm mt-1">Maximize your tax savings for FY {analysis.financialYear}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estimated Income */}
        <div className="p-6 bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 rounded-2xl border border-indigo-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-400 text-sm font-medium">Estimated Income</span>
          </div>
          <p className="text-3xl font-bold text-white">₹{analysis.estimatedIncome.toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-1">For FY {analysis.financialYear}</p>
        </div>

        {/* Potential Savings */}
        <div className="p-6 bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-2xl border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm font-medium">Potential Savings</span>
          </div>
          <p className="text-3xl font-bold text-white">₹{analysis.potentialSavings.toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-1">Additional tax savings possible</p>
        </div>

        {/* Compliance Status */}
        <div className={`p-6 rounded-2xl border ${
          analysis.complianceStatus === 'compliant' 
            ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/20'
            : 'bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-500/20'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {getComplianceIcon(analysis.complianceStatus)}
            <span className={`text-sm font-medium ${getComplianceColor(analysis.complianceStatus)}`}>
              Compliance Status
            </span>
          </div>
          <p className="text-2xl font-bold text-white capitalize">{analysis.complianceStatus.replace('_', ' ')}</p>
          <p className="text-gray-400 text-xs mt-1">Tax filing status</p>
        </div>
      </div>

      {/* Section 80C Progress */}
      {section80C && (
        <div className="p-6 bg-gray-900 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg">Section 80C Deductions</h3>
              <p className="text-gray-400 text-sm">Maximum limit: ₹1,50,000</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">₹{section80C.remaining.toLocaleString()}</p>
              <p className="text-gray-400 text-xs">Remaining</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Utilized</span>
              <span className="text-white font-semibold">
                ₹{section80C.utilized.toLocaleString()} / ₹{section80C.totalLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${(section80C.utilized / section80C.totalLimit) * 100}%` }}
              />
            </div>
          </div>

          {/* Suggestions */}
          {section80C.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Investment Suggestions:</p>
              {section80C.suggestions.slice(0, 3).map((suggestion, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">{suggestion.instrument}</p>
                    <p className="text-gray-400 text-xs">{suggestion.riskLevel} risk</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm font-semibold">Save ₹{suggestion.taxSaving}</p>
                    <p className="text-gray-400 text-xs">Invest ₹{suggestion.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-lg">Tax-Saving Recommendations</h3>
        
        {analysis.recommendations.length === 0 ? (
          <div className="p-6 bg-gray-900 rounded-2xl border border-white/10 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-white font-medium">You're all set!</p>
            <p className="text-gray-400 text-sm">No additional recommendations at this time</p>
          </div>
        ) : (
          analysis.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-6 bg-gray-900 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-full">
                      {rec.section}
                    </span>
                    {rec.deadline && (
                      <div className="flex items-center gap-1 text-yellow-400 text-xs">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(rec.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <p className="text-white font-medium mb-1">{rec.suggestion}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-green-400 font-bold text-lg">₹{rec.potentialSaving.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">Potential Saving</p>
                </div>
              </div>
              
              <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors">
                Take Action
              </button>
            </div>
          ))
        )}
      </div>

      {/* Tax Deadline Alert */}
      <div className="p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-400 font-medium text-sm">Tax Filing Deadline Approaching</p>
          <p className="text-gray-400 text-xs mt-1">
            Last date to file ITR for FY {analysis.financialYear} is March 31st. Don't miss out on tax-saving opportunities!
          </p>
        </div>
      </div>
    </div>
  );
}
