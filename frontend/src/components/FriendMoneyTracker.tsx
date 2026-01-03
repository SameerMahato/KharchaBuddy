"use client";

import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface PartialPayment {
    amount: number;
    date: string;
    notes: string;
}

interface Loan {
    _id: string;
    friendName: string;
    amount: number;
    currency: string;
    type: 'given' | 'received';
    description: string;
    dateGiven: string;
    dateReturned: string | null;
    isPaidBack: boolean;
    isReturnedOnTime: boolean;
    expectedReturnDate: string | null;
    notes: string;
    partialPayments?: PartialPayment[];
    remainingAmount?: number;
}

interface LoanStats {
    totalPendingGiven: number;
    totalPendingReceived: number;
    pendingCount: number;
    paidBackCount: number;
    returnedOnTimeCount: number;
    totalGivenThisMonth: number;
    monthlyLimit: number;
    budgetPercentage: number;
    friendsOwing: Array<{
        name: string;
        amount: number;
        currency: string;
        date: string;
        hasPartialPayments?: boolean;
        originalAmount?: number;
    }>;
}

const FriendMoneyTracker = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [stats, setStats] = useState<LoanStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showBudgetForm, setShowBudgetForm] = useState(false);
    const [lendingBudget, setLendingBudget] = useState({ monthlyLimit: 10000 });
    const [formData, setFormData] = useState({
        friendName: '',
        amount: '',
        currency: 'INR',
        type: 'given' as 'given' | 'received',
        description: '',
        expectedReturnDate: '',
        notes: ''
    });
    const [warning, setWarning] = useState('');
    const [showPartialPaymentForm, setShowPartialPaymentForm] = useState<string | null>(null);
    const [partialPaymentData, setPartialPaymentData] = useState({
        amount: '',
        notes: ''
    });

    useEffect(() => {
        fetchLoans();
        fetchStats();
        fetchLendingBudget();
    }, []);

    const fetchLoans = async () => {
        try {
            const res = await api.get('/loans');
            setLoans(res.data);
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/loans/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchLendingBudget = async () => {
        try {
            const res = await api.get('/lending-budget');
            setLendingBudget(res.data);
        } catch (error) {
            console.error('Error fetching budget:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setWarning('');

        try {
            const res = await api.post('/loans', formData);

            if (res.data.warning && res.data.wouldExceed) {
                setWarning(res.data.message);
                if (confirm(`${res.data.message}\n\nDo you still want to proceed?`)) {
                    // User confirmed, create anyway
                    const confirmRes = await api.post('/loans', {
                        ...formData,
                        force: true
                    });
                    setFormData({
                        friendName: '',
                        amount: '',
                        currency: 'INR',
                        type: 'given',
                        description: '',
                        expectedReturnDate: '',
                        notes: ''
                    });
                    setShowForm(false);
                    fetchLoans();
                    fetchStats();
                }
            } else {
                setFormData({
                    friendName: '',
                    amount: '',
                    currency: 'INR',
                    type: 'given',
                    description: '',
                    expectedReturnDate: '',
                    notes: ''
                });
                setShowForm(false);
                fetchLoans();
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error creating loan:', error);
            alert(error.response?.data?.message || 'Failed to create loan');
        }
    };

    const addPartialPayment = async (loanId: string) => {
        if (!partialPaymentData.amount || parseFloat(partialPaymentData.amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const res = await api.post(`/loans/${loanId}/partial-payment`, {
                amount: parseFloat(partialPaymentData.amount),
                notes: partialPaymentData.notes
            });

            setPartialPaymentData({ amount: '', notes: '' });
            setShowPartialPaymentForm(null);
            fetchLoans();
            fetchStats();

            if (res.data.message) {
                alert(res.data.message);
            }
        } catch (error: any) {
            console.error('Error adding partial payment:', error);
            alert(error.response?.data?.message || 'Failed to add partial payment');
        }
    };

    const markAsPaid = async (id: string) => {
        try {
            await api.put(`/loans/${id}/return`);
            fetchLoans();
            fetchStats();
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('Failed to mark as paid');
        }
    };

    const deleteLoan = async (id: string) => {
        if (!confirm('Delete this loan record?')) return;
        try {
            await api.delete(`/loans/${id}`);
            fetchLoans();
            fetchStats();
        } catch (error) {
            console.error('Error deleting loan:', error);
        }
    };

    const updateBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/lending-budget', { monthlyLimit: parseFloat(lendingBudget.monthlyLimit.toString()) });
            setShowBudgetForm(false);
            fetchLendingBudget();
            fetchStats();
        } catch (error) {
            console.error('Error updating budget:', error);
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;

    const pendingLoans = loans.filter(l => !l.isPaidBack);
    const paidLoans = loans.filter(l => l.isPaidBack);



    // ... imports

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBudgetForm(!showBudgetForm)}
                    className="text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
                >
                    ⚙️ Budget
                </Button>
                <Button
                    size="sm"
                    onClick={() => setShowForm(!showForm)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    + Add Loan
                </Button>
            </div>

            {showBudgetForm && (
                <form onSubmit={updateBudget} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                    <label className="block mb-2">Monthly Lending Limit (₹)</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={lendingBudget.monthlyLimit}
                            onChange={(e) => setLendingBudget({ monthlyLimit: parseFloat(e.target.value) })}
                            className="border p-2 rounded flex-1 dark:bg-gray-800 dark:border-gray-600"
                            min="0"
                            step="100"
                        />
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Save
                        </button>
                        <button type="button" onClick={() => setShowBudgetForm(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending (Given)</p>
                        <p className="text-2xl font-bold">₹{stats.totalPendingGiven.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{stats.pendingCount} loan(s)</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Paid Back</p>
                        <p className="text-2xl font-bold">{stats.paidBackCount}</p>
                        <p className="text-xs text-gray-500">{stats.returnedOnTimeCount} on time ✅</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                        <p className="text-2xl font-bold">₹{stats.totalGivenThisMonth.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                            {stats.budgetPercentage.toFixed(1)}% of ₹{stats.monthlyLimit.toFixed(2)} limit
                        </p>
                    </div>
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                    {warning && (
                        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 rounded text-yellow-800 dark:text-yellow-200">
                            {warning}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={formData.friendName}
                            onChange={(e) => setFormData({ ...formData, friendName: e.target.value })}
                            placeholder="Friend Name"
                            className="border p-2 rounded dark:bg-gray-800 dark:border-gray-600"
                            required
                        />
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'given' | 'received' })}
                            className="border p-2 rounded dark:bg-gray-800 dark:border-gray-600"
                        >
                            <option value="given">Money Given</option>
                            <option value="received">Money Received</option>
                        </select>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="Amount"
                            className="border p-2 rounded dark:bg-gray-800 dark:border-gray-600"
                            required
                            min="0"
                            step="0.01"
                        />
                        <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="border p-2 rounded dark:bg-gray-800 dark:border-gray-600"
                        >
                            <option value="INR">INR</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description (optional)"
                            className="border p-2 rounded dark:bg-gray-800 dark:border-gray-600 md:col-span-2"
                        />
                        <input
                            type="date"
                            value={formData.expectedReturnDate}
                            onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                            placeholder="Expected Return Date"
                            className="border p-2 rounded dark:bg-gray-800 dark:border-gray-600"
                        />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Add Loan
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {stats && stats.friendsOwing.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <h3 className="font-semibold mb-2">👥 Friends Owing You:</h3>
                    <div className="space-y-1">
                        {stats.friendsOwing.map((friend, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <div>
                                    <span>{friend.name}</span>
                                    {friend.hasPartialPayments && (
                                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Partial)</span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold">₹{friend.amount.toFixed(2)}</span>
                                    {friend.originalAmount !== friend.amount && (
                                        <span className="text-xs text-gray-500 ml-1 line-through">₹{(friend.originalAmount || 0).toFixed(2)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {pendingLoans.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">⏳ Pending Loans</h3>
                        {pendingLoans.map((loan) => {
                            const remaining = loan.remainingAmount !== undefined ? loan.remainingAmount : loan.amount;
                            const hasPartialPayments = loan.partialPayments && loan.partialPayments.length > 0;

                            return (
                                <div key={loan._id} className="p-4 border rounded mb-2 dark:border-gray-700">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{loan.friendName}</span>
                                                <Badge variant={loan.type === 'given' ? "destructive" : "default"} className={loan.type === 'given' ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200" : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200"}>
                                                    {loan.type === 'given' ? 'Given' : 'Received'}
                                                </Badge>
                                                {hasPartialPayments && (
                                                    <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                                                        Partial
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Original: {loan.currency} {loan.amount.toFixed(2)}
                                                </p>
                                                {remaining < loan.amount && (
                                                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                                        Remaining: {loan.currency} {remaining.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                            {hasPartialPayments && loan.partialPayments && (
                                                <div className="mt-2 text-xs text-gray-500">
                                                    <p className="font-semibold">Partial Payments:</p>
                                                    {loan.partialPayments.map((payment, idx) => (
                                                        <p key={idx} className="ml-2">
                                                            ₹{payment.amount.toFixed(2)} on {new Date(payment.date).toLocaleDateString()}
                                                            {payment.notes && ` - ${payment.notes}`}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                            {loan.description && (
                                                <p className="text-sm mt-1">{loan.description}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Given: {new Date(loan.dateGiven).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => setShowPartialPaymentForm(showPartialPaymentForm === loan._id ? null : loan._id)}
                                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                            >
                                                💰 Add Payment
                                            </button>
                                            <button
                                                onClick={() => markAsPaid(loan._id)}
                                                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                            >
                                                Mark Paid
                                            </button>
                                            <button
                                                onClick={() => deleteLoan(loan._id)}
                                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {showPartialPaymentForm === loan._id && (
                                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                            <p className="text-sm font-semibold mb-2">Add Partial Payment (Remaining: ₹{remaining.toFixed(2)})</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={partialPaymentData.amount}
                                                    onChange={(e) => setPartialPaymentData({ ...partialPaymentData, amount: e.target.value })}
                                                    placeholder="Amount"
                                                    className="border p-2 rounded flex-1 dark:bg-gray-800 dark:border-gray-600"
                                                    min="0"
                                                    max={remaining}
                                                    step="0.01"
                                                />
                                                <input
                                                    type="text"
                                                    value={partialPaymentData.notes}
                                                    onChange={(e) => setPartialPaymentData({ ...partialPaymentData, notes: e.target.value })}
                                                    placeholder="Notes (optional)"
                                                    className="border p-2 rounded flex-1 dark:bg-gray-800 dark:border-gray-600"
                                                />
                                                <button
                                                    onClick={() => addPartialPayment(loan._id)}
                                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowPartialPaymentForm(null);
                                                        setPartialPaymentData({ amount: '', notes: '' });
                                                    }}
                                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {paidLoans.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">✅ Paid Back</h3>
                        {paidLoans.map((loan) => (
                            <div key={loan._id} className="p-4 border rounded mb-2 dark:border-gray-700 bg-green-50 dark:bg-green-900/10">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{loan.friendName}</span>
                                            {loan.isReturnedOnTime && (
                                                <span className="text-green-600 dark:text-green-400" title="Returned within 2 months">
                                                    ✅ On Time
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {loan.currency} {loan.amount.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Returned: {loan.dateReturned ? new Date(loan.dateReturned).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteLoan(loan._id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {loans.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No loans recorded yet. Add one to get started!</p>
                )}
            </div>
        </div>
    );
};

export default FriendMoneyTracker;

