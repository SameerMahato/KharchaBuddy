"use client";

import { useEffect, useState } from 'react';
import api from '../utils/api';

interface Budget {
    _id: string;
    category: string;
    amount: number;
    period: string;
    spent?: number;
    remaining?: number;
    percentage?: number;
}

const BudgetManager = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        category: 'Food',
        amount: '',
        period: 'monthly'
    });

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/budgets');
            setBudgets(res.data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/budgets', {
                ...formData,
                amount: parseFloat(formData.amount)
            });
            setFormData({ category: 'Food', amount: '', period: 'monthly' });
            setShowForm(false);
            fetchBudgets();
        } catch (error) {
            console.error('Error creating budget:', error);
            alert('Failed to create budget');
        }
    };

    const deleteBudget = async (id: string) => {
        if (!confirm('Delete this budget?')) return;
        try {
            await api.delete(`/budgets/${id}`);
            fetchBudgets();
        } catch (error) {
            console.error('Error deleting budget:', error);
        }
    };

    const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Travel', 'Other', 'Total'];

    if (loading) return <div className="p-4 animate-pulse">Loading budgets...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Budgets</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                    {showForm ? 'Cancel' : '+ Add Budget'}
                </button>
            </div>

            {showForm && (
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-4">
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="Amount"
                                    className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                                <select
                                    value={formData.period}
                                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                    className="w-1/3 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                        >
                            Save Budget
                        </button>
                    </form>
                </div>
            )}

            {budgets.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 text-sm">No budgets yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {budgets.map((budget) => (
                        <div key={budget._id} className="group relative">
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{budget.category}</h3>
                                    <span className="text-xs text-gray-400 capitalize">({budget.period})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        ₹{budget.spent?.toFixed(0)} <span className="text-gray-400">/</span> ₹{budget.amount.toFixed(0)}
                                        <span className="ml-2 text-indigo-500 dark:text-indigo-400">
                                            (Remaining: ₹{(budget.amount - (budget.spent || 0)).toFixed(0)})
                                        </span>
                                    </span>
                                    <button
                                        onClick={() => deleteBudget(budget._id)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${(budget.percentage || 0) > 100
                                        ? 'bg-red-500'
                                        : (budget.percentage || 0) > 80
                                            ? 'bg-amber-400'
                                            : 'bg-emerald-500'
                                        }`}
                                    style={{ width: `${Math.min(100, budget.percentage || 0)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BudgetManager;

