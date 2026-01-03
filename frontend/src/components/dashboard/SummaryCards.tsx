import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, Wallet, PiggyBank } from "lucide-react";

interface SummaryCardsProps {
    totalBalance: number;
    income: number;
    expense: number;
    savings: number;
}

export default function SummaryCards({ totalBalance, income, expense, savings }: SummaryCardsProps) {
    const cards = [
        {
            title: "Total Balance",
            amount: totalBalance,
            icon: Wallet,
            color: "text-blue-500",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
            title: "Total Income",
            amount: income,
            icon: ArrowUpIcon,
            color: "text-green-500",
            bgColor: "bg-green-50 dark:bg-green-900/20",
        },
        {
            title: "Total Expense",
            amount: expense,
            icon: ArrowDownIcon,
            color: "text-red-500",
            bgColor: "bg-red-50 dark:bg-red-900/20",
        },
        {
            title: "Total Savings",
            amount: savings,
            icon: PiggyBank,
            color: "text-purple-500",
            bgColor: "bg-purple-50 dark:bg-purple-900/20",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {card.title}
                        </CardTitle>
                        <div className={`p-2 rounded-full ${card.bgColor}`}>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${card.amount.toLocaleString()}</div>
                        {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
