"use client";

import BudgetManager from '@/components/BudgetManager';
import FriendMoneyTracker from '@/components/FriendMoneyTracker';

export default function BudgetsPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white mb-8">Budgets & Planning</h1>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                    <BudgetManager />
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                    <h2 className="text-xl font-bold text-white mb-6">Friend & Loan Tracker</h2>
                    <FriendMoneyTracker />
                </div>
            </div>
        </div>
    );
}
