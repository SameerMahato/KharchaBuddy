"use client";

import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, AlertCircle, Info } from "lucide-react"

interface Alert {
    type: 'danger' | 'warning' | 'info';
    category: string;
    message: string;
    percentage: string | null;
}

const SpendingAlerts = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await api.get('/alerts');
            setAlerts(res.data.alerts || []);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };



    if (loading || alerts.length === 0) return null;

    return (
        <div className="grid gap-3 mb-6">
            {alerts.map((alert, idx) => {
                const variant = alert.type === 'danger' ? "destructive" : "default";
                const icon = alert.type === 'danger' ? <AlertCircle className="h-4 w-4" /> :
                    alert.type === 'warning' ? <Terminal className="h-4 w-4" /> :
                        <Info className="h-4 w-4" />;

                // Custom styling for warning/info since default only has 2 variants
                const className = alert.type === 'warning'
                    ? "border-amber-500/50 text-amber-600 dark:border-amber-500 [&>svg]:text-amber-600"
                    : variant === 'default' ? "border-blue-500/50 text-blue-600 dark:border-blue-500 [&>svg]:text-blue-600" : "";

                return (
                    <Alert key={idx} variant={variant} className={className}>
                        {icon}
                        <AlertTitle>{alert.category}</AlertTitle>
                        <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                );
            })}
        </div>
    );
};

export default SpendingAlerts;

