"use client";

import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import ReceiptUpload from '@/components/ReceiptUpload';
import { useState } from 'react';

export default function ExpensesPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-8">Expense Management</h1>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <ExpenseList refreshTrigger={refreshTrigger} />
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                        <h2 className="text-xl font-semibold text-white mb-4">Add New Expense</h2>
                        <ExpenseForm onExpenseAdded={() => setRefreshTrigger(prev => prev + 1)} />
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                        <ReceiptUpload onExpenseAdded={() => setRefreshTrigger(prev => prev + 1)} />
                    </div>
                </div>
            </div>
        </div>
    );
}
