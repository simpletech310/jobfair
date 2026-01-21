"use client";

import { useAuth } from "@/context/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { clsx } from "clsx";
import { Briefcase, Building, LayoutDashboard, LogOut, MessageSquare, Search as SearchIcon, User, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmployerSidebarProps {
    currentView: string;
    setCurrentView: (view: any) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function EmployerSidebar({ currentView, setCurrentView, isSidebarOpen, setIsSidebarOpen }: EmployerSidebarProps) {
    const router = useRouter();
    const { user, logout } = useAuth();
    const unreadCount = useUnreadMessages();

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'jobs', label: 'My Jobs', icon: Briefcase },
        { id: 'candidates', label: 'Applications', icon: Users },
        { id: 'search', label: 'Find Candidates', icon: SearchIcon },
        { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
    ];

    return (
        <>
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transform transition-transform duration-300 md:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-zinc-100">
                        <img src="/logo.png" alt="JobFair" className="h-8 w-auto object-contain" />
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-4 mt-8 space-y-1">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setCurrentView(item.id as any); setIsSidebarOpen(false); }}
                                className={clsx(
                                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    currentView === item.id
                                        ? "bg-black text-white shadow-lg shadow-black/10"
                                        : "text-zinc-500 hover:text-black hover:bg-zinc-100"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </div>
                                {item.badge && (
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                        currentView === item.id ? "bg-white text-black" : "bg-red-500 text-white"
                                    )}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                        <button
                            onClick={() => router.push('/employer/profile')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-500 hover:text-black hover:bg-zinc-100 transition-all duration-200"
                        >
                            <Building className="h-5 w-5" />
                            Company Profile
                        </button>
                    </nav>

                    {/* User */}
                    <div className="p-4 border-t border-zinc-100">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 mb-2">
                            <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center">
                                <User className="h-4 w-4 text-zinc-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-black truncate">{user?.email}</p>
                                <p className="text-xs text-zinc-500">Employer</p>
                            </div>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-zinc-500 hover:text-red-500 transition"
                        >
                            <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                    </div>
                </div>
            </aside >

            {/* Mobile Overlay */}
            {
                isSidebarOpen && (
                    <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" />
                )
            }
        </>
    );
}
