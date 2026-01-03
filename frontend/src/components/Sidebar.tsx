"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Wallet,
    Receipt,
    TrendingUp,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
// Removed useAuth import as it was only used for logout

interface SidebarProps {
    mobileOpen?: boolean;
    setMobileOpen?: (open: boolean) => void;
}

const Sidebar = ({ mobileOpen, setMobileOpen }: SidebarProps) => {
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
        { icon: Receipt, label: 'Expenses', href: '/dashboard/expenses' },
        { icon: Wallet, label: 'Budgets & Loans', href: '/dashboard/budgets' },
        { icon: TrendingUp, label: 'Analytics', href: '/dashboard/analytics' },
    ];

    return (
        <>
            {/* Overlay for mobile */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setMobileOpen?.(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    'fixed md:static inset-y-0 left-0 z-50 w-[280px] flex flex-col h-full transition-transform duration-300 ease-in-out border-r border-white/10 bg-black/40 backdrop-blur-xl',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}
            >
                <div className="h-full flex flex-col p-6">
                    {/* 1. APP BRANDING */}
                    <div className="flex items-center justify-center mb-10 px-2">
                        <Link href="/dashboard" className="group">
                            <Logo className="w-10 h-10" showText={true} />
                        </Link>
                        {mobileOpen && (
                            <button
                                onClick={() => setMobileOpen?.(false)}
                                className="md:hidden text-white/70 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* 2. NAVIGATION MENU */}
                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen?.(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                                        'hover:bg-white/5 border border-transparent',
                                        isActive
                                            ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]'
                                            : 'text-gray-400 hover:text-white'
                                    )}
                                >
                                    <item.icon
                                        size={20}
                                        className={cn(
                                            'transition-colors duration-300',
                                            isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-indigo-300'
                                        )}
                                    />
                                    <span className="font-medium text-sm tracking-wide">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout removed as requested */}
                </div>
            </aside >
        </>
    );
};

export default Sidebar;
