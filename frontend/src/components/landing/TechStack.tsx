"use client";

import { Database, Server, Code, Lock, Cpu, Globe } from "lucide-react";

const TechStack = () => {
    return (
        <section className="py-20 border-t border-white/10 bg-black/40 relative z-10">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-12">
                    Secure. Scalable. <span className="text-gray-400">Built with Modern Tech.</span>
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    <div className="flex flex-col items-center gap-3 group">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/10">
                            <Globe className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">Next.js 16</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 group">
                        <div className="w-12 h-12 rounded-full bg-cyan-900/20 flex items-center justify-center group-hover:bg-cyan-900/30 transition-colors border border-cyan-500/20">
                            <Code className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">Tailwind v4</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 group">
                        <div className="w-12 h-12 rounded-full bg-green-900/20 flex items-center justify-center group-hover:bg-green-900/30 transition-colors border border-green-500/20">
                            <Database className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">MongoDB</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 group">
                        <div className="w-12 h-12 rounded-full bg-yellow-900/20 flex items-center justify-center group-hover:bg-yellow-900/30 transition-colors border border-yellow-500/20">
                            <Server className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">Express.js</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 group">
                        <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center group-hover:bg-red-900/30 transition-colors border border-red-500/20">
                            <Lock className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">JWT Auth</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 group">
                        <div className="w-12 h-12 rounded-full bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-900/30 transition-colors border border-purple-500/20">
                            <Cpu className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">Gemini/OpenAI</span>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default TechStack;
