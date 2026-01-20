"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Menu, X, User, LogOut, ChevronRight, LayoutDashboard } from "lucide-react";
import { clsx } from "clsx";

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fetch profile for avatar
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const supabase = createClient(); // Need client here

    useEffect(() => {
        const fetchAvatar = async () => {
            if (user && user.role === 'seeker') {
                const { data } = await supabase
                    .from('seekers')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single();
                if (data) setAvatarUrl(data.avatar_url);
            }
            setProfileLoaded(true);
        };

        if (user) fetchAvatar();
    }, [user]);

    // Dynamic Navigation Links
    const getNavLinks = () => {
        if (!user) {
            return [
                { name: "For Seekers", href: "/benefits/seeker" },
                { name: "For Employers", href: "/benefits/employer" },
            ];
        }
        if (user.role === 'employer') {
            return [
                { name: "Home", href: "/employer" },
                { name: "Interested", href: "/benefits/employer" },
                // { name: "Dashboard", href: "/employer" } // Dashboard is handled by sidebar/profile menu
            ];
        }
        // Seeker
        return [
            { name: "Home", href: "/" },
            { name: "Interested", href: "/benefits/seeker" },
            { name: "Jobs", href: "/jobs" },
        ];
    };

    const links = getNavLinks();

    // Scroll effect for glassmorphism
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Find Jobs", href: "/jobs", role: "seeker" },
        { name: "Post a Job", href: "/employer/post-job", role: "employer" },
    ];

    return (
        <header
            className={clsx(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled ? "bg-white/80 backdrop-blur-md border-b border-black/5 py-4" : "bg-transparent py-6"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <img src="/logo.png" alt="JobFair" className="h-10 w-auto object-contain" />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {links.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-zinc-600 hover:text-black transition"
                        >
                            {link.name}
                        </Link>
                    ))}

                    {user ? (
                        <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                            <Link href={user.role === 'employer' ? "/employer" : "/profile"} className="flex items-center gap-2 text-sm font-bold text-black hover:text-zinc-600 group">
                                {user.role === 'seeker' && avatarUrl ? (
                                    <img src={avatarUrl} alt="Me" className="h-8 w-8 rounded-full object-cover border border-black/10 group-hover:border-black/30 transition" />

                                ) : (
                                    <span className="bg-zinc-100 p-2 rounded-full text-black">
                                        {user.role === 'employer' ? <LayoutDashboard className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    </span>
                                )}
                                {user.role === 'employer' && "Dashboard"}
                                {user.role === 'seeker' && !avatarUrl && "My Profile"}
                            </Link>
                            <button onClick={logout} className="text-zinc-500 hover:text-black flex items-center gap-2 text-sm font-medium transition">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden lg:inline">Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 pl-4 border-l border-black/10">
                            <Link href="/auth" className="text-sm font-bold text-zinc-900 hover:text-black transition">Sign In</Link>
                            <Link href="/auth" className="px-4 py-2 rounded-full bg-black text-white text-sm font-bold hover:bg-zinc-800 shadow-lg hover:shadow-black/20 transition">
                                Get Started
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden text-black"
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-b border-black/10 p-6 md:hidden animate-in slide-in-from-top-4 shadow-xl">
                    <nav className="flex flex-col gap-4">
                        {links.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-lg font-medium text-slate-300"
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="h-px bg-white/10 my-2" />

                        {user ? (
                            <>
                                <Link href={user.role === 'employer' ? "/employer" : "/profile"} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between text-lg font-bold text-black">
                                    <div className="flex items-center gap-3">
                                        {user.role === 'seeker' && avatarUrl ? (
                                            <img src={avatarUrl} alt="Me" className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            <User className="h-5 w-5" />
                                        )}
                                        {user.role === 'employer' ? "Dashboard" : "My Profile"}
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-zinc-400" />
                                </Link>
                                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-left text-sm text-red-500 font-medium">
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="grid gap-3">
                                <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 rounded-xl bg-zinc-100 border border-zinc-200 text-center text-black font-bold">Sign In</Link>
                                <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 rounded-xl bg-black text-center text-white font-bold shadow-lg">Get Started</Link>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
