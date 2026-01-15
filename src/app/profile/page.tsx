"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Clock, CheckCircle, XCircle, Briefcase, User, Edit2, Play, FileText, MessageSquare, Send, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

export default function SeekerProfile() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const supabase = createClient();

    const [profile, setProfile] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Chat State (Mock heavily for MVP as we don't have a messages table yet)
    const [selectedChatApp, setSelectedChatApp] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/auth');
            } else {
                fetchData();
            }
        }
    }, [user, authLoading]);

    const fetchData = async () => {
        if (!user) return;
        try {
            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('seekers')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
            }

            // 2. Fetch Applications with Job details
            const { data: appsData, error: appsError } = await supabase
                .from('applications')
                .select(`
                    *,
                    jobs (
                        id,
                        title,
                        employer_id,
                        employers ( company_name ) 
                    )
                `)
                .eq('seeker_id', user.id)
                .order('created_at', { ascending: false });

            if (appsData) {
                // Formatting for UI
                const formattedApps = appsData.map(app => ({
                    ...app,
                    jobTitle: app.jobs?.title,
                    employerId: app.jobs?.employer_id,
                    companyName: Array.isArray(app.jobs?.employers)
                        ? app.jobs?.employers[0]?.company_name
                        : app.jobs?.employers?.company_name
                }));
                setApplications(formattedApps);
            }

        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Placeholder for Chat - Local state only for now as requested by "Demo" feel if backend missing
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msg = {
            id: Date.now().toString(),
            senderId: 'seeker',
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, msg]);
        setNewMessage("");
        setTimeout(scrollToBottom, 100);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'accepted':
            case 'interviewing':
                return <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400 border border-green-500/20"><CheckCircle className="h-3.5 w-3.5" /> Interview</span>;
            case 'rejected': return <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/20"><XCircle className="h-3.5 w-3.5" /> Rejected</span>;
            default: return <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/20"><Clock className="h-3.5 w-3.5" /> In Review</span>;
        }
    };

    if (loading || authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

            <header className="sticky top-0 z-10 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/")} className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-bold text-white tracking-tight">My Profile</h1>
                    </div>
                    <button
                        onClick={() => router.push("/profile/edit")}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                    >
                        <Edit2 className="h-3 w-3" /> Edit Mode
                    </button>
                </div>
            </header>

            <main className="relative mx-auto max-w-4xl p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Col: Profile Card */}
                <div className="space-y-6">
                    <div className="glass rounded-3xl p-6 text-center">
                        <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                            <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-slate-400" />
                                )}
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{profile?.full_name || "Anonymous User"}</h2>
                        <p className="text-sm text-slate-400 mb-4">{profile?.title || "No Title Set"}</p>

                        {profile?.intro_video_url && (
                            <div className="mb-4 aspect-[3/4] rounded-xl overflow-hidden relative group cursor-pointer border border-white/10">
                                <video controls src={profile.intro_video_url} className="h-full w-full object-cover" />
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 justify-center">
                            {profile?.skills && Array.isArray(profile.skills) && profile.skills.map((skill: string) => (
                                <span key={skill} className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-slate-300 border border-white/5 uppercase font-bold tracking-wider">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {profile?.resume_stats?.name && (
                        <div className="glass rounded-2xl p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{profile.resume_stats.name}</p>
                                <a href={profile.resume_stats.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">View Resume</a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Applications & Bio */}
                <div className="md:col-span-2 space-y-8">

                    {/* Bio & XP */}
                    <div className="glass rounded-3xl p-8 space-y-6">
                        <div>
                            <h3 className="text-sm font-bold uppercase text-slate-500 mb-2">About</h3>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                                {profile?.bio || "No bio added yet. Click 'Edit Mode' to add your details."}
                            </p>
                        </div>

                        {profile?.experience_years > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase text-slate-500 mb-4">Experience</h3>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-white font-bold">{profile.experience_years} Years of Experience</p>
                                    <p className="text-sm text-slate-400">Total Professional Experience</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Applications List */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">My Applications</h3>
                        {applications.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
                                <p className="text-slate-500">No active applications.</p>
                                <button onClick={() => router.push("/jobs")} className="mt-4 text-blue-400 font-bold hover:underline">Find Jobs</button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {applications.map((app) => (
                                    <div key={app.id} className="glass rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
                                                <Briefcase className="h-5 w-5 text-white/80" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{app.jobTitle || "Job Application"}</h4>
                                                <p className="text-xs text-slate-400">{app.companyName || "Company"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedChatApp(app); }}
                                                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
                                            >
                                                <MessageSquare className="h-5 w-5" />
                                            </button>
                                            {getStatusBadge(app.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

            </main>

            {/* Chat Modal (Mocked Behavior for UI Demo) */}
            {selectedChatApp && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
                    <div className="w-full sm:max-w-md h-[80vh] bg-slate-900 sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white bg-slate-700 font-bold">
                                    {selectedChatApp.companyName?.[0] || "C"}
                                </div>
                                <div>
                                    <h3
                                        className="font-bold text-white cursor-pointer hover:text-blue-400 transition"
                                        onClick={() => selectedChatApp.employerId && router.push(`/companies/${selectedChatApp.employerId}`)}
                                    >
                                        {selectedChatApp.companyName || "Employer"}
                                    </h3>
                                    <p className="text-xs text-blue-400">{selectedChatApp.jobTitle}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedChatApp(null)} className="p-2 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
                            {messages.length === 0 && (
                                <p className="text-center text-slate-600 text-sm mt-10">Start a conversation...</p>
                            )}
                            {messages.map((msg) => (
                                <div key={msg.id} className={clsx("flex flex-col max-w-[80%]", msg.senderId === 'seeker' ? "ml-auto items-end" : "items-start")}>
                                    <div className={clsx("rounded-2xl px-4 py-2 text-sm", msg.senderId === 'seeker' ? "bg-blue-600 text-white" : "bg-white/10 text-slate-200")}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-slate-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-white/10">
                            <div className="relative">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a reply..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:border-blue-500 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-1 top-1 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-0 transition"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
