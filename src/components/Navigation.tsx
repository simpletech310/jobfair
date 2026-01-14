"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Briefcase, User, LayoutDashboard, PlusCircle, Users, Menu, X } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const seekerLinks = [
        { name: "Home", href: "/", icon: Home },
        { name: "Find Jobs", href: "/jobs", icon: Briefcase },
        { name: "My Profile", href: "/profile", icon: User },
    ];

    const employerLinks = [
        { name: "Dashboard", href: "/employer", icon: LayoutDashboard },
        { name: "Post Job", href: "/employer/post-job", icon: PlusCircle },
        { name: "Talent", href: "/employer/candidates", icon: Users },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <>
            {/* Mobile Toggle (Floating) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition hover:bg-blue-500 active:scale-95 md:hidden"
            >
                {isOpen ? <X /> : <Menu />}
            </button>

            {/* Desktop / Mobile Drawer */}
            <nav
                className={clsx(
                    "fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-950/90 backdrop-blur-xl border-r border-white/5 p-6 transition-transform duration-300 ease-in-out md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-full flex-col">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Job<span className="text-blue-500">Fair</span>
                        </h1>
                        <p className="text-xs text-slate-500">MVP Dev Navigation</p>
                    </div>

                    <div className="space-y-8">
                        {/* Seeker Section */}
                        <div>
                            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Job Seeker</h3>
                            <div className="space-y-1">
                                {seekerLinks.map((link) => (
                                    <button
                                        key={link.href}
                                        onClick={() => {
                                            router.push(link.href);
                                            setIsOpen(false);
                                        }}
                                        className={clsx(
                                            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                                            isActive(link.href)
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <link.icon className="h-4 w-4" />
                                        {link.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Employer Section */}
                        <div>
                            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Employer</h3>
                            <div className="space-y-1">
                                {employerLinks.map((link) => (
                                    <button
                                        key={link.href}
                                        onClick={() => {
                                            router.push(link.href);
                                            setIsOpen(false);
                                        }}
                                        className={clsx(
                                            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                                            isActive(link.href)
                                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <link.icon className="h-4 w-4" />
                                        {link.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto rounded-xl bg-white/5 p-4">
                        <p className="text-xs text-slate-400">
                            <span className="block font-bold text-white mb-1">Testing Tip:</span>
                            Use the menu to quickly jump between roles to verify real-time updates.
                        </p>
                    </div>
                </div>
            </nav>

            {/* Overlay for Mobile */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
                />
            )}
        </>
    );
}
