"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AIInsights from '@/components/AIInsights';
import SpendingAlerts from '@/components/SpendingAlerts';
import DashboardCard from '@/components/DashboardCard';
// Only need recent expenses on the dashboard, not the full list management component if we have a separate page
// But for simplicity of re-use, we use it. Ideally we would strip controls.
import ExpenseList from '@/components/ExpenseList';
import api from '@/utils/api';
import { ArrowUpRight, Wallet, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [summary, setSummary] = useState({ totalExpenses: 0, budgetStatus: 0, recentTransactionsCount: 0 });

    useEffect(() => {
        if (!token) {
            router.push('/login');
        } else {
            const fetchSummary = async () => {
                try {
                    const res = await api.get('/analytics?period=month');
                    setSummary({
                        totalExpenses: res.data.total,
                        budgetStatus: 85,
                        recentTransactionsCount: res.data.count
                    });
                } catch (e) {
                    console.error(e);
                }
            };
            fetchSummary();
        }
    }, [token, router]);

    if (!user) return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;

    return (
        <div className="space-y-8">
            {/* 1. Header & Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-1">
                        Welcome back, <span className="text-indigo-400 font-semibold">{user.name}</span>! Here's your financial overview.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/expenses">
                        <button className="bg-white text-indigo-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors shadow-lg shadow-white/10">
                            + Add Expense
                        </button>
                    </Link>
                </div>
            </div>

            {/* 2. Spending Alerts */}
            <SpendingAlerts />

            {/* 3. Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Expenses Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <ArrowUpRight className="w-5 h-5 text-indigo-100" />
                            </div>
                            <span className="text-indigo-200 text-sm font-medium bg-indigo-800/30 px-2 py-1 rounded">This Month</span>
                        </div>
                        <h3 className="text-indigo-100 text-sm font-medium">Total Expenses</h3>
                        <p className="text-3xl font-bold mt-1">₹{summary.totalExpenses.toFixed(0)}</p>
                    </div>
                </div>

                {/* Budget Status Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 text-white relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Wallet className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium">Budget Status</h3>
                    <div className="flex items-end gap-2 mt-1">
                        <p className="text-3xl font-bold text-white">Good</p>
                        <p className="text-emerald-400 text-sm mb-1 pb-1">On Track</p>
                    </div>
                </div>

                {/* Recent Activity Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 text-white relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <CreditCard className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium">Transactions</h3>
                    <p className="text-3xl font-bold mt-1 text-white">{summary.recentTransactionsCount}</p>
                    <p className="text-gray-500 text-xs mt-1">Recorded this month</p>
                </div>
            </div>

            {/* 4. Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Expenses */}
                <div className="lg:col-span-2 space-y-6">
                    <DashboardCard title="Recent Activity" action={<Link href="/dashboard/expenses" className="text-xs text-indigo-400 hover:text-indigo-300">View All</Link>}>
                        <ExpenseList />
                    </DashboardCard>
                </div>

                {/* Right Column: AI & insights */}
                <div className="space-y-6">
                    <AIInsights />

                    {/* Quick Link Card */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-900/10 to-purple-900/10 border border-pink-500/10">
                        <h3 className="text-white font-semibold mb-2">Split the Bill?</h3>
                        <p className="text-gray-400 text-sm mb-4">Track shared expenses and loans easily with friends.</p>
                        <Link href="/dashboard/budgets">
                            <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 transition-colors">
                                Go to Friends Tracker
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
