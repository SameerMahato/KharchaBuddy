"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Menu } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar Wrapper */}
            <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Mobile Header Trigger */}
                <div className="md:hidden p-4 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-md">
                    <span className="font-bold text-white">Logo</span>
                    <button onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="text-white" />
                    </button>
                </div>

                <Header />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-black/20">
                    {children}
                </main>
            </div>
        </div>
    );
}
