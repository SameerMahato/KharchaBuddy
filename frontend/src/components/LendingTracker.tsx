"use client";

import { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/utils/api';

interface Loan {
  id: string;
  friendName: string;
  amount: number;
  remainingAmount: number;
  type: 'given' | 'received';
  dateGiven: string;
  expectedReturnDate?: string;
  isPaidBack: boolean;
  trustScoreAtTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export default function LendingTracker() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState<'all' | 'given' | 'received'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await api.get('/loans');
      setLoans(response.data.loans || []);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLoans = loans.filter(loan => {
    if (filter === 'all') return true;
    return loan.type === filter;
  });

  const stats = {
    totalGiven: loans.filter(l => l.type === 'given' && !l.isPaidBack).reduce((sum, l) => sum + l.remainingAmount, 0),
    totalReceived: loans.filter(l => l.type === 'received' && !l.isPaidBack).reduce((sum, l) => sum + l.remainingAmount, 0),
    activeLoans: loans.filter(l => !l.isPaidBack).length
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-green-400 bg-green-500/10';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Lending Tracker</h2>
        <p className="text-gray-400 text-sm mt-1">Manage money lent to and borrowed from friends</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-2xl border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm font-medium">Money Lent</span>
          </div>
          <p className="text-3xl font-bold text-white">₹{stats.totalGiven.toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-1">Outstanding amount</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-2xl border border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm font-medium">Money Borrowed</span>
          </div>
          <p className="text-3xl font-bold text-white">₹{stats.totalReceived.toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-1">Amount to repay</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 rounded-2xl border border-indigo-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-400 text-sm font-medium">Active Loans</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.activeLoans}</p>
          <p className="text-gray-400 text-xs mt-1">Pending transactions</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-900 p-1 rounded-lg border border-white/10 w-fit">
        {(['all', 'given', 'received'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-2xl border border-white/10">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No loans found</h3>
          <p className="text-gray-400 text-sm">Start tracking your lending and borrowing</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => {
            const isOverdue = loan.expectedReturnDate && new Date(loan.expectedReturnDate) < new Date();
            const progress = ((loan.amount - loan.remainingAmount) / loan.amount) * 100;

            return (
              <div
                key={loan.id}
                className="p-6 bg-gray-900 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {loan.friendName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{loan.friendName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          loan.type === 'given' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {loan.type === 'given' ? 'Lent' : 'Borrowed'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(loan.riskLevel)}`}>
                          {loan.riskLevel} risk
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">₹{loan.remainingAmount.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">of ₹{loan.amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {progress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Repayment Progress</span>
                      <span className="text-white">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Trust Score:</span>
                      <span className={`font-semibold ${getTrustScoreColor(loan.trustScoreAtTime)}`}>
                        {loan.trustScoreAtTime}/100
                      </span>
                    </div>
                    {loan.expectedReturnDate && (
                      <div className="flex items-center gap-2">
                        {isOverdue ? (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-red-400">Overdue</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">
                              Due {new Date(loan.expectedReturnDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs transition-colors">
                    Send Reminder
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
