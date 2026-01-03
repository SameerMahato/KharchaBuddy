"use client";

import { Wallet, ShieldCheck, LayoutDashboard, ScanLine, BrainCircuit, BellRing, TrendingUp, PieChart, Download, Users, Banknote, Globe } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description, className = "" }: any) => (
    <div className={`p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-[1.02] hover:shadow-xl group ${className}`}>
        <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/30 transition-colors">
            <Icon className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
);

const Features = () => {
    return (
        <div className="flex flex-col gap-24 py-20 relative z-10">

            {/* Core Features */}
            <section id="features" className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Everything You Need to <span className="text-indigo-400">Control Your Money</span></h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">Powerful tools to manage your personal finances with bank-grade security and modern design.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={Wallet}
                        title="Expense Tracking"
                        description="Effortlessly categorize and manage your daily expenses. Add transactions in seconds and keep your organized."
                    />
                    <FeatureCard
                        icon={ShieldCheck}
                        title="Secure Authentication"
                        description="Your data is protected with industry-standard JWT authentication and encrypted storage."
                    />
                    <FeatureCard
                        icon={LayoutDashboard}
                        title="Smart Dashboard"
                        description="Get a real-time overview of your financial health with an intuitive, fully responsive dashboard."
                    />
                </div>
            </section>

            {/* AI Features */}
            <section id="ai" className="container mx-auto px-6 relative">
                <div className="absolute inset-0 bg-indigo-900/10 blur-[100px] -z-10 rounded-full" />
                <div className="text-center mb-16">
                    <span className="text-purple-400 font-semibold tracking-wider text-sm uppercase mb-2 block">Powered by Gemini & OpenAI</span>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">AI That <span className="text-purple-400">Understands Your Spending</span></h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={ScanLine}
                        title="Smart Receipt Scanning"
                        description="Just snap a photo. Our AI automatically extracts merchant, date, and total amount details with high accuracy."
                    />
                    <FeatureCard
                        icon={BrainCircuit}
                        title="AI Financial Insights"
                        description="Receive personalized advice on how to save more based on your unique spending habits."
                    />
                    <FeatureCard
                        icon={BellRing}
                        title="Spending Alerts"
                        description="Get notified immediately when you exceed your budget limits or detect unusual spending patterns."
                    />
                </div>

                {/* AI Insight Sample Card */}
                <div className="mt-12 max-w-md mx-auto">
                    <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-1 rounded-2xl">
                        <div className="bg-black/80 backdrop-blur-xl p-6 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                                </div>
                                <span className="text-sm font-medium text-white">AI Insight</span>
                            </div>
                            <p className="text-gray-200">"You spent <span className="text-red-400 font-bold">21% more</span> on food this month compared to last month. Consider setting a weekly limit of $150."</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Analytics & Budgeting */}
            <section id="analytics" className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Visualize, Plan, and <span className="text-green-400">Stay on Track</span></h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-green-500/10 mt-1"><TrendingUp className="w-5 h-5 text-green-400" /></div>
                                <div>
                                    <h4 className="text-lg font-semibold text-white">Interactive Charts</h4>
                                    <p className="text-gray-400 text-sm">Dive deep into your data with dynamic Recharts visualizations.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-blue-500/10 mt-1"><PieChart className="w-5 h-5 text-blue-400" /></div>
                                <div>
                                    <h4 className="text-lg font-semibold text-white">Budget Management</h4>
                                    <p className="text-gray-400 text-sm">Set monthly limits for categories and track your progress.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-orange-500/10 mt-1"><Download className="w-5 h-5 text-orange-400" /></div>
                                <div>
                                    <h4 className="text-lg font-semibold text-white">Export Data</h4>
                                    <p className="text-gray-400 text-sm">Download your financial reports in CSV or PDF formats instantly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        {/* Mock Chart UI */}
                        <div className="aspect-square md:aspect-video bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 animate-pulse" />
                            {/* Bars Mock */}
                            <div className="flex items-end justify-between h-full gap-2 px-4 pb-4">
                                {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                    <div key={i} className="w-full bg-indigo-500/50 rounded-t-sm hover:bg-indigo-500 transition-colors" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social & Utilities */}
            <section className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Built for <span className="text-pink-400">Real-Life Finances</span></h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={Users}
                        title="Friend Money Tracking"
                        description="Split bills and track loans with friends easily. Never forget who owes you money."
                    />
                    <FeatureCard
                        icon={Banknote}
                        title="Loan Management"
                        description="Keep track of personal loans and repayment schedules in one dedicated place."
                    />
                    <FeatureCard
                        icon={Globe}
                        title="Multi-Currency Support"
                        description="Travel often? Track expenses in multiple currencies with real-time conversion monitoring."
                    />
                </div>
            </section>

        </div>
    );
};

export default Features;
