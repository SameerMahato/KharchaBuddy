"use client";

import { useEffect, useState } from 'react';
import api from '../utils/api';
import DashboardCard from './DashboardCard';
import { TrendingUp, CreditCard, Activity } from 'lucide-react';

export interface AnalyticsData {
    total: number;
    avgExpense: number;
    count: number;
    categoryBreakdown: Record<string, number>;
    dailyTrend: Record<string, number>;
    monthlyTrend?: Array<{ name: string; income: number; expense: number }>;
    topExpenses: Array<{ text: string; amount: number; date: string }>;
    period: string;
}

interface AnalyticsDashboardProps {
    data: AnalyticsData | null;
    period: string;
    setPeriod: (period: string) => void;
    loading: boolean;
}

const AnalyticsDashboard = ({ data, period, setPeriod, loading }: AnalyticsDashboardProps) => {
    if (loading) return <div className="p-4 text-gray-400">Loading analytics...</div>;
    if (!data) return null;

    const analytics = data;

    const categoryEntries = Object.entries(analytics.categoryBreakdown).sort((a, b) => b[1] - a[1]);
    const maxCategory = Math.max(...categoryEntries.map(([_, val]) => val), 1);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-white/20"><Activity size={18} /></div>
                        <p className="text-indigo-100 text-sm font-medium">Total Spent</p>
                    </div>
                    <p className="text-3xl font-bold mt-1">₹{analytics.total.toFixed(0)}</p>
                    <p className="text-xs text-indigo-200 mt-2 capitalize opacity-80">{period}</p>
                </div>

                <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-white relative overflow-hidden group hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-emerald-500/20"><CreditCard size={18} className="text-emerald-400" /></div>
                        <p className="text-gray-400 text-sm font-medium">Avg. Transaction</p>
                    </div>
                    <p className="text-3xl font-bold text-white mt-1">₹{analytics.avgExpense.toFixed(0)}</p>
                    <p className="text-xs text-gray-500 mt-2">Per expense</p>
                </div>

                <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-white relative overflow-hidden group hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-orange-500/20"><TrendingUp size={18} className="text-orange-400" /></div>
                        <p className="text-gray-400 text-sm font-medium">Total Transactions</p>
                    </div>
                    <p className="text-3xl font-bold text-white mt-1">{analytics.count}</p>
                    <p className="text-xs text-gray-500 mt-2">Count</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <DashboardCard title="Spending by Category"
                    action={
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="text-sm border-none bg-white/5 text-gray-300 rounded-lg p-1 focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:bg-white/10"
                        >
                            <option value="week" className="bg-gray-900 text-gray-300">Week</option>
                            <option value="month" className="bg-gray-900 text-gray-300">Month</option>
                            <option value="year" className="bg-gray-900 text-gray-300">Year</option>
                        </select>
                    }
                >
                    <div className="space-y-5">
                        {categoryEntries.map(([category, amount]) => (
                            <div key={category} className="group">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-300 font-medium">{category}</span>
                                    <span className="text-white font-semibold">₹{amount.toFixed(0)}</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out group-hover:scale-[1.02]"
                                        style={{ width: `${(amount / maxCategory) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                {analytics.topExpenses.length > 0 && (
                    <DashboardCard title="Large Expenses">
                        <div className="divide-y divide-white/5">
                            {analytics.topExpenses.map((expense, idx) => (
                                <div key={idx} className="flex justify-between items-center py-4 first:pt-0 last:pb-0 group hover:bg-white/5 px-2 rounded-lg -mx-2 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400 border border-white/5">
                                            {expense.text.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{expense.text}</p>
                                            <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-rose-400/90 bg-rose-500/10 px-2 py-1 rounded">
                                        -₹{expense.amount.toFixed(0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </DashboardCard>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
