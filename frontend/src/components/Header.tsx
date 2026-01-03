"use client";

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { LogOut, User } from 'lucide-react';

const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Dashboard Title or Breadcrumb could go here */}
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-lg font-semibold text-white hover:text-indigo-400 transition-colors">
                            Dashboard
                        </Link>
                    </div>

                    <nav>
                        <ul className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <li className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                            <User className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-200">
                                            {user.name}
                                        </span>
                                    </li>
                                    <li>
                                        <Button
                                            variant="ghost"
                                            onClick={logout}
                                            className="text-gray-400 hover:text-red-400 hover:bg-red-900/10 h-9 px-3"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Logout
                                        </Button>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>
                                        <Link href="/login">
                                            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">Login</Button>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/register">
                                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">Get Started</Button>
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
