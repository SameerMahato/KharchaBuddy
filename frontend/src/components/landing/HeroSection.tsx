"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const HeroSection = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '5s' }} />
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
                    <span className="text-sm font-medium text-indigo-200">AI-Powered Finance Control</span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                        SMART FINANCE
                    </span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        MANAGEMENT MADE EASY
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    Track expenses, scan receipts, analyze spending, and get AI-powered
                    insights — all in one secure platform designed for your financial freedom.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <Link href="/register">
                        <Button className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all hover:shadow-[0_0_40px_rgba(79,70,229,0.7)] hover:-translate-y-1">
                            Get Started Free
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="outline" className="h-12 px-8 text-base border-white/20 text-white hover:bg-white/10 rounded-full backdrop-blur-sm transition-all hover:-translate-y-1">
                            View Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Trust Metrics */}
                <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-white/10 pt-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                    {[
                        { label: "Expenses Tracked", value: "10k+" },
                        { label: "AI Accuracy", value: "99%" },
                        { label: "Avg. Savings Incr.", value: "25%" },
                        { label: "Active Users", value: "500+" }
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</span>
                            <span className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
