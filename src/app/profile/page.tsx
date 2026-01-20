"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Clock, CheckCircle, XCircle, Briefcase, User, Edit2, Play, FileText, MessageSquare, Send, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

import { useMessages } from "@/hooks/useMessages";

export default function SeekerProfile() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const supabase = createClient();

    const [profile, setProfile] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Chat State
    const [selectedChatApp, setSelectedChatApp] = useState<any | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const { messages, sendMessage, loading: msgLoading } = useMessages(activeConversationId);

    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [conversations, setConversations] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/auth');
            } else {
                fetchData();
            }
        }
    }, [user, authLoading]);

    // Check for conversation when app is selected
    useEffect(() => {
        if (selectedChatApp && user) {
            checkConversation();
        } else {
            setActiveConversationId(null);
        }
    }, [selectedChatApp, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const checkConversation = async () => {
        if (!selectedChatApp || !user) return;

        // Find if conversation exists for this job/employer
        // Note: Assuming one conv per job/application context
        const { data, error } = await supabase
            .from('conversations')
            .select('id')
            .eq('seeker_id', user.id)
            .eq('employer_id', selectedChatApp.employerId)
            // .eq('job_id', selectedChatApp.job_id) // Optional: restrict to specific job context if needed
            .single();

        if (data) {
            setActiveConversationId(data.id);
        } else {
            setActiveConversationId(null);
        }
    };

    const fetchData = async () => {
        if (!user) return;
        try {
            // 1. Fetch Profile
            const { data: profileData } = await supabase
                .from('seekers')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) setProfile(profileData);

            // 2. Fetch Applications
            const { data: appsData } = await supabase
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

            // 3. Fetch Active Conversations (for badges)
            const { data: convData } = await supabase
                .from('conversations')
                .select('employer_id, id')
                .eq('seeker_id', user.id);

            if (convData) {
                setConversations(convData);
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversationId) return;

        await sendMessage(newMessage);
        setNewMessage("");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'accepted':
            case 'interviewing':
                return <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600 border border-green-200"><CheckCircle className="h-3.5 w-3.5" /> Interview</span>;
            case 'rejected': return <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 border border-red-200"><XCircle className="h-3.5 w-3.5" /> Rejected</span>;
            default: return <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-500 border border-zinc-200"><Clock className="h-3.5 w-3.5" /> In Review</span>;
        }
    };

    if (loading || authLoading) return <div className="min-h-screen bg-white flex items-center justify-center text-black"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-200">
            <div className="fixed inset-0 bg-white pointer-events-none" />

            <header className="sticky top-0 z-10 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/")} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-black transition">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-bold text-black text-lg tracking-tight">My Profile</h1>
                    </div>
                    <button
                        onClick={() => router.push("/profile/edit")}
                        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-50 transition"
                    >
                        <Edit2 className="h-3 w-3" /> Edit Mode
                    </button>
                </div>
            </header>

            <main className="relative mx-auto max-w-4xl p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Col: Profile Card */}
                <div className="space-y-6">
                    <div className="glass rounded-3xl p-6 text-center border border-zinc-200 bg-white">
                        <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-400 p-0.5">
                            <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-zinc-300" />
                                )}
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-black mb-1">{profile?.full_name || "Anonymous User"}</h2>
                        <p className="text-sm text-zinc-500 mb-4">{profile?.title || "No Title Set"}</p>

                        {profile?.intro_video_url && (
                            <div className="mb-4 aspect-[3/4] rounded-xl overflow-hidden relative group cursor-pointer border border-zinc-200">
                                <video controls src={profile.intro_video_url} className="h-full w-full object-cover" />
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 justify-center">
                            {profile?.skills && Array.isArray(profile.skills) && profile.skills.map((skill: string) => (
                                <span key={skill} className="px-2 py-1 rounded-md bg-zinc-100 text-[10px] text-zinc-600 border border-zinc-200 uppercase font-bold tracking-wider">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {profile?.resume_stats?.name && (
                        <div className="glass rounded-2xl p-4 flex items-center gap-4 border border-zinc-200 bg-white">
                            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-black truncate">{profile.resume_stats.name}</p>
                                <a href={profile.resume_stats.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:underline">View Resume</a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Applications & Bio */}
                <div className="md:col-span-2 space-y-8">

                    {/* Bio & XP */}
                    <div className="glass rounded-3xl p-8 space-y-6 border border-zinc-200 bg-white">
                        <div>
                            <h3 className="text-sm font-bold uppercase text-zinc-400 mb-2">About</h3>
                            <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                                {profile?.bio || "No bio added yet. Click 'Edit Mode' to add your details."}
                            </p>
                        </div>

                        {profile?.experience_years > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase text-zinc-400 mb-4">Experience</h3>
                                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                                    <p className="text-black font-bold">{profile.experience_years} Years of Experience</p>
                                    <p className="text-sm text-zinc-500">Total Professional Experience</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Applications List */}
                    <div>
                        <h3 className="text-xl font-bold text-black mb-4">My Applications</h3>
                        {applications.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
                                <p className="text-zinc-500">No active applications.</p>
                                <button onClick={() => router.push("/jobs")} className="mt-4 text-black font-bold hover:underline">Find Jobs</button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {applications.map((app) => {
                                    const hasConversation = conversations.some(c => c.employer_id === app.employerId);
                                    return (
                                        <div key={app.id} className="glass rounded-xl p-4 flex items-center justify-between hover:bg-zinc-50 transition border border-zinc-200 bg-white">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                                                    <Briefcase className="h-5 w-5 text-zinc-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-black text-sm">{app.jobTitle || "Job Application"}</h4>
                                                    <p className="text-xs text-zinc-500">{app.companyName || "Company"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedChatApp(app); }}
                                                    className="relative p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black transition group"
                                                >
                                                    <MessageSquare className="h-5 w-5" />
                                                    {hasConversation && (
                                                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-orange-500 border-2 border-white shadow-sm animate-pulse" />
                                                    )}
                                                </button>
                                                {getStatusBadge(app.status)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>

            </main>

            {/* Chat Modal (Mocked Behavior for UI Demo) */}
            {/* Chat Modal */}
            {selectedChatApp && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
                    <div className="w-full sm:max-w-md h-[80vh] bg-white sm:rounded-3xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white bg-black font-bold">
                                    {selectedChatApp.companyName?.[0] || "C"}
                                </div>
                                <div>
                                    <h3
                                        className="font-bold text-black cursor-pointer hover:text-zinc-600 transition"
                                        onClick={() => selectedChatApp.employerId && router.push(`/companies/${selectedChatApp.employerId}`)}
                                    >
                                        {selectedChatApp.companyName || "Employer"}
                                    </h3>
                                    <p className="text-xs text-zinc-500">{selectedChatApp.jobTitle}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedChatApp(null)} className="p-2 text-zinc-400 hover:text-black"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                            {messages.length === 0 && (
                                <p className="text-center text-zinc-400 text-sm mt-10">Start a conversation...</p>
                            )}
                            {messages.map((msg) => (
                                <div key={msg.id} className={clsx("flex flex-col max-w-[80%]", msg.sender_id === user?.id ? "ml-auto items-end" : "items-start")}>
                                    <div className={clsx("rounded-2xl px-4 py-2 text-sm", msg.sender_id === user?.id ? "bg-black text-white" : "bg-zinc-100 text-black")}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />

                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-zinc-50 border-t border-zinc-100">
                            <div className="relative">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a reply..."
                                    className="w-full bg-white border border-zinc-200 rounded-full py-3 pl-4 pr-12 text-sm text-black focus:border-black focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-1 top-1 p-2 rounded-full bg-black text-white hover:bg-zinc-800 disabled:opacity-0 transition"
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
