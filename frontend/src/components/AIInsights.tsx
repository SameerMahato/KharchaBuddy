"use client";

import { useState } from 'react';
import api from '../utils/api';

const AIInsights = () => {
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(false);

    const analyzeExpenses = async () => {
        setLoading(true);
        setInsight('');
        try {
            const res = await api.post('/ai/analyze');
            setInsight(res.data.message);
        } catch (error) {
            console.error('Error analyzing expenses:', error);
            setInsight('Failed to get insights. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        ✨ AI Insights
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">
                        Smart analysis of your spending habits.
                    </p>
                </div>
            </div>

            {insight ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 text-sm leading-relaxed border border-white/20">
                    {insight}
                </div>
            ) : (
                <div className="bg-white/5 rounded-lg p-4 mb-4 text-sm text-indigo-100 border border-white/10">
                    Tap analyze to get personalized financial advice based on your recent activity.
                </div>
            )}

            <button
                onClick={analyzeExpenses}
                disabled={loading}
                className="w-full bg-white text-indigo-600 px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm text-sm"
            >
                {loading ? 'Analyzing...' : 'Analyze Spending'}
            </button>
        </div>
    );
};

export default AIInsights;
