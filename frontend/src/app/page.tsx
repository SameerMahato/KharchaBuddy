import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import Features from "@/components/landing/Features";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Footer from "@/components/landing/Footer";
import TechStack from "@/components/landing/TechStack";

export default function Home() {
  return (
    <main className="min-h-screen bg-black selection:bg-indigo-500/30">
      {/* Global Background Gradient / Noise */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      <Navbar />

      <div className="relative z-10">
        <HeroSection />
        <DashboardPreview />
        <Features />
        <TechStack />

        {/* Final CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-600/10 blur-[100px] pointer-events-none" />
          <div className="container mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Take Control of Your <br />Finances with AI</h2>
            <a href="/register" className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-lg font-medium text-indigo-600 shadow-lg shadow-indigo-500/20 transition-transform hover:scale-105 hover:bg-indigo-50">
              Start Free Now
            </a>
            <p className="mt-4 text-sm text-gray-500">No credit card required · Free plan available</p>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
