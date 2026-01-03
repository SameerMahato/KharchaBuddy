"use client";



const DashboardPreview = () => {
    return (
        <section className="py-20 container mx-auto px-6 text-center relative z-10">
            <div className="mb-12">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                    Experience the <span className="text-indigo-400">Future of Finance</span>
                </h2>
                <p className="text-gray-400 text-lg">
                    A clean, intuitive interface designed to give you clarity.
                </p>
            </div>

            <div className="relative mx-auto max-w-6xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 animate-pulse"></div>
                <div className="relative bg-[#0F0F12] rounded-xl border border-white/10 shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center group">

                    {/* We will simulate the dashboard look with CSS since we don't have a screenshot yet */}
                    <div className="w-full h-full flex flex-col p-4 bg-zinc-950">
                        {/* Header Mock */}
                        <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 mb-4">
                            <div className="w-32 h-4 bg-white/10 rounded"></div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/10"></div>
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20"></div>
                            </div>
                        </div>
                        <div className="flex flex-1 gap-4 overflow-hidden">
                            {/* Sidebar Mock */}
                            <div className="w-64 border-r border-white/10 hidden md:flex flex-col gap-3 p-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className={`h-10 w-full rounded-lg ${i === 1 ? 'bg-indigo-500/20' : 'bg-transparent'} flex items-center px-3 gap-3`}>
                                        <div className={`w-5 h-5 rounded ${i === 1 ? 'bg-indigo-500' : 'bg-white/10'}`}></div>
                                        <div className="w-20 h-2 bg-white/10 rounded"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Main Content Mock */}
                            <div className="flex-1 flex flex-col gap-4">
                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-24 rounded-xl bg-white/5 border border-white/10 p-3">
                                            <div className="w-8 h-8 rounded bg-white/10 mb-2"></div>
                                            <div className="w-16 h-3 bg-white/10 rounded mb-1"></div>
                                            <div className="w-24 h-5 bg-white/20 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                                {/* Charts Row */}
                                <div className="flex-1 grid grid-cols-3 gap-4 pb-4">
                                    <div className="col-span-2 bg-white/5 rounded-xl border border-white/10 p-4">
                                        <div className="w-32 h-4 bg-white/10 rounded mb-4"></div>
                                        <div className="flex items-end justify-between h-32 gap-2 mt-4">
                                            {[60, 40, 70, 50, 80, 90, 65, 75, 55, 85].map((h, i) => (
                                                <div key={i} className="w-full bg-indigo-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-1 bg-white/5 rounded-xl border border-white/10 p-4">
                                        <div className="w-24 h-4 bg-white/10 rounded mb-4"></div>
                                        <div className="w-32 h-32 rounded-full border-[8px] border-purple-500/30 border-t-purple-500 mx-auto mt-4"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Overlay Text */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-indigo-600 px-6 py-2 rounded-full text-white font-medium shadow-lg">Live Interactive Demo</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DashboardPreview;
