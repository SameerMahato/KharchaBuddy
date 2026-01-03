import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function AIInsights() {
    return (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border-purple-100 dark:border-purple-900/30">
            <CardContent className="flex items-start gap-4 p-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">AI Insight</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        You spent <span className="font-bold text-red-500">18% more</span> this month on food compared to last month. Consider setting a budget of $300 for dining out to stay on track.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
