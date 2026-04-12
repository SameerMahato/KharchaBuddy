"use client";

import { useState, useEffect } from 'react';
import { Target, Plus, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import api from '@/utils/api';

interface Goal {
  id: string;
  name: string;
  type: 'savings' | 'investment' | 'debt_payoff' | 'purchase' | 'retirement';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'completed' | 'paused';
}

export default function FinancialGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await api.get('/goals');
      setGoals(response.data.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgress = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-orange-400 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'savings': return '💰';
      case 'investment': return '📈';
      case 'debt_payoff': return '💳';
      case 'purchase': return '🛍️';
      case 'retirement': return '🏖️';
      default: return '🎯';
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Financial Goals</h2>
          <p className="text-gray-400 text-sm mt-1">Track and achieve your financial objectives</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-2xl border border-white/10">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No goals yet</h3>
          <p className="text-gray-400 text-sm mb-4">Start by creating your first financial goal</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = getProgress(goal);
            const daysRemaining = Math.ceil(
              (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={goal.id}
                className="p-6 bg-gray-900 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getTypeIcon(goal.type)}</span>
                    <div>
                      <h3 className="text-white font-semibold">{goal.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <DollarSign className="w-3 h-3" />
                      Current
                    </div>
                    <p className="text-white font-semibold">₹{goal.currentAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Target className="w-3 h-3" />
                      Target
                    </div>
                    <p className="text-white font-semibold">₹{goal.targetAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Time Remaining */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">
                    {daysRemaining > 0 ? (
                      <>{daysRemaining} days remaining</>
                    ) : (
                      <span className="text-red-400">Overdue</span>
                    )}
                  </span>
                </div>

                {/* Action Button */}
                <button className="w-full mt-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                  Add Contribution
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
