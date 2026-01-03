"use client";

import Link from "next/link";
import { Twitter, Github, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "../Logo";

const Footer = () => {
    return (
        <footer className="border-t border-white/10 bg-black pt-20 pb-10 relative z-10">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="mb-6 block">
                            <Logo className="w-10 h-10" showText={true} />
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Take control of your financial future with the power of AI. Secure, smart, and simple expense management.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <Twitter className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <Github className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="#features" className="hover:text-indigo-400 transition-colors">Features</Link></li>
                            <li><Link href="#ai" className="hover:text-indigo-400 transition-colors">AI Insights</Link></li>
                            <li><Link href="#analytics" className="hover:text-indigo-400 transition-colors">Analytics</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Company</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Security</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Get Started</h4>
                        <p className="text-gray-400 text-sm mb-4">Ready to optimize your spending? Join thousands of smart KharchaBuddies today.</p>
                        <Link href="/register">
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                Start Free Trial
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">© 2025 KharchaBuddy. All rights reserved.</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Built with Next.js 16 & Tailwind v4</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer;
