"use client";
import React, { useState, useEffect } from 'react';
import AnalyticsDashboard, { AnalyticsData } from '@/components/AnalyticsDashboard';
import MainChart from '@/components/dashboard/MainChart';
import CategoryChart from '@/components/dashboard/CategoryChart';
import api from '@/utils/api';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('year'); // Default to year for trend view

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics?period=${period}`);
            setAnalytics(res.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare Chart Data
    const chartData = analytics?.monthlyTrend || [];

    // Prepare Pie Data
    const pieData = analytics ? Object.entries(analytics.categoryBreakdown).map(([name, value], index) => ({
        name,
        value,
        color: ['#8b5cf6', '#ec4899', '#06b6d4', '#6366f1', '#10b981', '#f59e0b'][index % 6]
    })) : [];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Financial Analytics</h1>
                    <p className="text-gray-400 mt-2">Deep dive into your spending habits and trends.</p>
                </div>
            </div>

            {/* Enhanced Overview Cards & Spending by Category */}
            <AnalyticsDashboard data={analytics} period={period} setPeriod={setPeriod} loading={loading} />

            {/* Charts Section */}
            {!loading && analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                        <h3 className="text-xl font-semibold text-white mb-6">Monthly Expense Trend</h3>
                        {chartData.length > 0 ? (
                            <MainChart data={chartData} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500">
                                No trend data available for this period
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                        <h3 className="text-xl font-semibold text-white mb-6">Expense Distribution</h3>
                        {pieData.length > 0 ? (
                            <CategoryChart data={pieData} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500">
                                No category data available
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
