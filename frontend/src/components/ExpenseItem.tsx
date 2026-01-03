"use client";

interface Expense {
    _id: string;
    text: string;
    amount: number;
    date: string;
    category?: string;
    isRecurring?: boolean;
    currency?: string;
}

interface ExpenseItemProps {
    expense: Expense;
    onDelete: (id: string) => void;
}

const ExpenseItem = ({ expense, onDelete }: ExpenseItemProps) => {
    const categoryColors: Record<string, string> = {
        Food: 'bg-green-500/20 text-green-400 border-green-500/50',
        Transport: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        Shopping: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
        Bills: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        Entertainment: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
        Healthcare: 'bg-red-500/20 text-red-400 border-red-500/50',
        Education: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
        Travel: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
        Other: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    };

    const categoryStyle = categoryColors[expense.category || 'Other'] || categoryColors['Other'];

    return (
        <li className="flex justify-between items-center bg-white/5 border border-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl mb-3 group">
            <div className="flex flex-col flex-1">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-white/90">{expense.text}</span>
                    {expense.isRecurring && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                            Recurring
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                    </span>
                    {expense.category && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryStyle}`}>
                            {expense.category}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="font-bold text-base text-white">
                    {expense.currency || '₹'} {Math.abs(expense.amount).toFixed(2)}
                </span>
                <button
                    onClick={() => onDelete(expense._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-white/10"
                    title="Delete Expense"
                >
                    ✕
                </button>
            </div>
        </li>
    );
};

export default ExpenseItem;
