"use client";

import { useEffect, useState, useRef } from "react";
import { localDB } from "@/lib/local-db";
import { ArrowLeft, Clock, CheckCircle, XCircle, FileVideo, Briefcase, User, Edit2, Play, FileText, Share2, MessageSquare, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

export default function SeekerProfile() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [jobs, setJobs] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    // Chat State
    const [selectedChatApp, setSelectedChatApp] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedChatApp) {
            const timer = setInterval(() => {
                localDB.getMessages(selectedChatApp.id).then(msgs => {
                    setMessages(msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
                });
            }, 1000); // Simple polling for MVP demo
            return () => clearInterval(timer);
        }
    }, [selectedChatApp]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadData = async () => {
        try {
            const profileData = await localDB.getProfile("user-1");
            const [appData, jobList] = await Promise.all([
                localDB.getApplications(),
                localDB.getJobs()
            ]);

            setProfile(profileData);

            const jobMap = jobList.reduce((acc: any, job: any) => {
                acc[job.id] = job;
                return acc;
            }, {});
            setJobs(jobMap);

            setApplications(appData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChatApp) return;

        const msg = {
            id: crypto.randomUUID(),
            applicationId: selectedChatApp.id,
            senderId: 'seeker',
            receiverId: 'employer',
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        await localDB.sendMessage(msg);
        // Optimistic update done by polling in MVP or setMessages
        setMessages(prev => [...prev, msg]);
        setNewMessage("");
    };

    const getVideoUrl = (blob: Blob) => {
        return URL.createObjectURL(blob);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'shortlisted': return <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400 border border-green-500/20"><CheckCircle className="h-3.5 w-3.5" /> Shortlisted</span>;
            case 'rejected': return <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/20"><XCircle className="h-3.5 w-3.5" /> Rejected</span>;
            default: return <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/20"><Clock className="h-3.5 w-3.5" /> In Review</span>;
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500">Loading...</div>;

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
                                <User className="h-10 w-10 text-slate-400" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{profile?.name || "Anonymous User"}</h2>
                        <p className="text-sm text-slate-400 mb-4">{profile?.title || "No Title Set"}</p>

                        {profile?.introVideoBlob && (
                            <div className="mb-4 aspect-[3/4] rounded-xl overflow-hidden relative group cursor-pointer">
                                <video src={getVideoUrl(profile.introVideoBlob)} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <Play className="h-10 w-10 text-white opacity-80" />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 justify-center">
                            {profile?.skills?.map((skill: string) => (
                                <span key={skill} className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-slate-300 border border-white/5 uppercase font-bold tracking-wider">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {profile?.resumeBlob && (
                        <div className="glass rounded-2xl p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white truncate max-w-[150px]">{profile.resumeBlob.name}</p>
                                <p className="text-xs text-slate-500">Last Updated Today</p>
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
                            <p className="text-slate-300 leading-relaxed">
                                {profile?.bio || "No bio added yet. Click 'Edit Mode' to add your details."}
                            </p>
                        </div>

                        {profile?.experience && profile.experience.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase text-slate-500 mb-4">Experience</h3>
                                <div className="space-y-4">
                                    {profile.experience.map((exp: any, i: number) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                            <div>
                                                <h4 className="font-bold text-white">{exp.role}</h4>
                                                <p className="text-sm text-slate-400">{exp.company} • {exp.dates}</p>
                                            </div>
                                        </div>
                                    ))}
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
                                            <div className={clsx("h-10 w-10 rounded-lg flex items-center justify-center", jobs[app.jobId]?.logo || 'bg-slate-800')}>
                                                <Briefcase className="h-5 w-5 text-white/80" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{jobs[app.jobId]?.title || "Application"}</h4>
                                                <p className="text-xs text-slate-400">{jobs[app.jobId]?.company}</p>
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

            {/* Chat Modal */}
            {selectedChatApp && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
                    <div className="w-full sm:max-w-md h-[80vh] bg-slate-900 sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className={clsx("h-10 w-10 rounded-full flex items-center justify-center text-white font-bold", jobs[selectedChatApp.jobId]?.logo || 'bg-slate-700')}>
                                    {jobs[selectedChatApp.jobId]?.company?.[0] || "C"}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{jobs[selectedChatApp.jobId]?.company || "Employer"}</h3>
                                    <p className="text-xs text-blue-400">{jobs[selectedChatApp.jobId]?.title}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedChatApp(null)} className="p-2 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
                            {messages.length === 0 && (
                                <p className="text-center text-slate-600 text-sm mt-10">No messages yet.</p>
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
