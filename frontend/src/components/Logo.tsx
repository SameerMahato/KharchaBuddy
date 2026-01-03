import React from 'react';

export const Logo = ({ className = "w-8 h-8", showText = false }: { className?: string, showText?: boolean }) => {
    return (
        <div className="flex items-center gap-2">
            <div className={`relative ${className} flex items-center justify-center`}>
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl filter hover:brightness-110 transition-all duration-300">
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" /> {/* Indigo */}
                            <stop offset="50%" stopColor="#8b5cf6" /> {/* Violet */}
                            <stop offset="100%" stopColor="#ec4899" /> {/* Pink */}
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Background Shape - Soft Hexagon/Circle Hybrid */}
                    <path
                        d="M50 5 L93.3 30 V80 L50 105 L6.7 80 V30 Z"
                        fill="url(#logoGradient)"
                        opacity="0.2"
                        transform="scale(0.8) translate(12,8)"
                    />

                    {/* Main Icon - Abstract K / Wallet combination */}
                    <path
                        d="M30 25 V75 M30 50 L70 20 M30 50 L70 80"
                        stroke="url(#logoGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        className="animate-pulse-slow"
                    />

                    {/* Accent Dot - The 'Buddy' / AI Spark */}
                    <circle cx="75" cy="50" r="6" fill="#06b6d4" className="animate-ping-slow" />
                </svg>
            </div>
            {showText && (
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-gray-400 tracking-tight">
                    KharchaBuddy
                </span>
            )}
        </div>
    );
};
