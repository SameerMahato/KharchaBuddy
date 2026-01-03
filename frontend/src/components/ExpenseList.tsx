"use client";

import { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import ExpenseItem from './ExpenseItem';
import DashboardCard from './DashboardCard';

interface Expense {
    _id: string;
    text: string;
    amount: number;
    date: string;
    category?: string;
    isRecurring?: boolean;
}

interface ExpenseListProps {
    refreshTrigger?: number;
}

const ExpenseList = ({ refreshTrigger = 0 }: ExpenseListProps) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchExpenses = useCallback(async () => {
        try {
            const res = await api.get('/expenses');
            setExpenses(res.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses, refreshTrigger]);

    const deleteExpense = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            setExpenses(expenses.filter((expense) => expense._id !== id));
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Failed to delete expense');
        }
    };

    const exportCSV = async () => {
        try {
            const response = await api.get('/export/csv', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'expenses.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Failed to export expenses');
        }
    };

    return (
        <DashboardCard
            title="Recent Transactions"
            action={
                <button
                    onClick={exportCSV}
                    className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded transition-colors"
                >
                    Export CSV
                </button>
            }
        >
            <div className="max-h-[500px] overflow-auto pr-1">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>No expenses found.</p>
                        <p className="text-sm mt-1">Add a new expense to get started.</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {expenses.map((expense) => (
                            <ExpenseItem
                                key={expense._id}
                                expense={expense}
                                onDelete={deleteExpense}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </DashboardCard>
    );
};

export default ExpenseList;
