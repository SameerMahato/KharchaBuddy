import React from 'react';

interface DashboardCardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className = '', action }) => {
    return (
        <Card className={`bg-white/5 border-white/10 backdrop-blur-md shadow-lg ${className}`}>
            {(title || action) && (
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/5">
                    {title && <CardTitle className="text-base font-semibold text-white">{title}</CardTitle>}
                    {action && <div>{action}</div>}
                </CardHeader>
            )}
            <CardContent className="pt-4">
                {children}
            </CardContent>
        </Card>
    );
};

export default DashboardCard;
