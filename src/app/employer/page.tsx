"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
    Play,
    X,
    Clock,
    CheckCircle,
    XCircle,
    User,
    Plus,
    Send,
    Lock,
    FileText,
    Loader2
} from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

export default function EmployerDashboard() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const supabase = createClient();

    const [applications, setApplications] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [jobs, setJobs] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    // Tab State for Modal
    const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'messages'>('profile');

    // Message State (Mock for MVP)
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Profile Context
    const [seekerProfile, setSeekerProfile] = useState<any>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/auth');
            } else {
                // Check role? For MVP we assume if they are here they are an employer or can be one.
                loadData();
            }
        }
    }, [user, authLoading]);

    useEffect(() => {
        if (selectedApp) {
            // Mock messages
            setMessages([
                { id: '1', senderId: 'system', content: 'You can start messaging this candidate.', timestamp: new Date().toISOString() }
            ]);
            loadSeekerProfile(selectedApp.seeker_id);
        }
    }, [selectedApp]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeTab]);

    const loadData = async () => {
        try {
            if (!user) return;
            // 1. Get Employer's Jobs
            const { data: jobList, error: jobError } = await supabase
                .from('jobs')
                .select('*')
                .eq('employer_id', user.id);

            if (jobError) throw jobError;

            const jobMap = (jobList || []).reduce((acc: any, job: any) => {
                acc[job.id] = job;
                return acc;
            }, {});
            setJobs(jobMap);

            // 2. Get Applications for those jobs
            // Since we have RLS "Employers see applications for their jobs", we can just select all applications?
            // Wait, RLS usually filters rows. 
            // Query: select * from applications. RLS will filter to only those matching employer's jobs.
            const { data: apps, error: appError } = await supabase
                .from('applications')
                .select(`
                    *,
                    jobs (title)
                `)
                .order('created_at', { ascending: false });

            if (appError) throw appError;

            // 3. We also need data about the seeker for the "card" (name, etc).
            // The `applications` table has `seeker_id`.
            // We can join `seekers`?
            // Let's refetch apps with seeker join to be efficient.
            const { data: richApps, error: richAppError } = await supabase
                .from('applications')
                .select(`
                    *,
                    jobs (title),
                    seekers (full_name, intro_video_url)
                `)
                .order('created_at', { ascending: false });

            if (richAppError) throw richAppError;

            setApplications(richApps || []);

        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadSeekerProfile = async (seekerId: string) => {
        const { data, error } = await supabase
            .from('seekers')
            .select('*')
            .eq('id', seekerId)
            .single();

        if (data) {
            setSeekerProfile(data);
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleStatusUpdate = async (status: 'interviewing' | 'rejected') => { // Schema has 'interviewing', 'rejected', 'accepted'
        if (!selectedApp) return;

        const { error } = await supabase
            .from('applications')
            .update({ status })
            .eq('id', selectedApp.id);

        if (error) {
            alert("Failed to update status");
            return;
        }

        // Optimistic Update
        setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status } : a));
        setSelectedApp((prev: any) => prev ? { ...prev, status } : null);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedApp) return;

        // Mock send
        const msg = {
            id: crypto.randomUUID(),
            senderId: 'employer',
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        setMessages([...messages, msg]);
        setNewMessage("");
        // In real app: Insert into messages table
    };

    // derived state
    const openRolesCount = Object.keys(jobs).length;
    const totalApplications = applications.length;

    if (authLoading || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-10 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">E</div>
                        <span className="text-lg font-bold text-white tracking-tight">Employer Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/employer/candidates")}
                            className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
                        >
                            <User className="h-4 w-4" /> Access Talent
                        </button>
                        <button
                            onClick={() => router.push("/employer/post-job")}
                            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
                        >
                            <Plus className="h-4 w-4" /> Post a Job
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative mx-auto max-w-7xl p-6">

                {/* Stats Row */}
                <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="glass rounded-2xl p-5">
                        <p className="text-xs font-bold uppercase text-slate-500">Total Applicants</p>
                        <p className="mt-1 text-3xl font-extrabold text-white">{totalApplications}</p>
                    </div>
                    <div className="glass rounded-2xl p-5">
                        <p className="text-xs font-bold uppercase text-slate-500">Shortlisted</p>
                        <p className="mt-1 text-3xl font-extrabold text-green-400">{applications.filter(a => a.status === 'interviewing' || a.status === 'accepted').length}</p>
                    </div>
                    <div className="glass rounded-2xl p-5">
                        <p className="text-xs font-bold uppercase text-slate-500">Open Roles</p>
                        <p className="mt-1 text-3xl font-extrabold text-blue-400">{openRolesCount}</p>
                    </div>
                    <div className="glass rounded-2xl p-5">
                        <p className="text-xs font-bold uppercase text-slate-500">Pending</p>
                        <p className="mt-1 text-3xl font-extrabold text-purple-400">{applications.filter(a => a.status === 'pending').length}</p>
                    </div>
                </div>

                {/* Feed */}
                <h2 className="mb-6 text-xl font-bold text-white">Recent Applications</h2>

                {applications.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                        <p className="text-slate-500">No applications yet. Post a job to get started!</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {applications.map((app) => (
                            <div
                                key={app.id}
                                onClick={() => { setSelectedApp(app); setActiveTab('profile'); }}
                                className={clsx(
                                    "group glass relative cursor-pointer overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10",
                                    (app.status === 'interviewing' || app.status === 'accepted') && "ring-2 ring-green-500/50",
                                    app.status === 'rejected' && "opacity-60 grayscale"
                                )}
                            >
                                {/* Status Badge */}
                                {(app.status === 'interviewing' || app.status === 'accepted') && (
                                    <div className="absolute top-3 right-3 z-20 rounded-full bg-green-500 px-2 py-1 text-[10px] font-bold text-black shadow-lg flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> SHORTLISTED
                                    </div>
                                )}
                                {app.status === 'rejected' && (
                                    <div className="absolute top-3 right-3 z-20 rounded-full bg-red-500/20 border border-red-500/50 px-2 py-1 text-[10px] font-bold text-red-500 shadow-lg flex items-center gap-1">
                                        <XCircle className="h-3 w-3" /> REJECTED
                                    </div>
                                )}

                                {/* Video Thumbnail */}
                                <div className="relative aspect-[3/4] w-full bg-slate-900">
                                    {!app.seekers?.intro_video_url && !app.video_url ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                            <User className="h-10 w-10 text-slate-600" />
                                        </div>
                                    ) : (
                                        <video
                                            src={app.video_url || app.seekers?.intro_video_url}
                                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                            muted
                                            playsInline
                                        />
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-lg font-bold leading-tight text-white">
                                            {app.seekers?.full_name || "Applicant"}
                                        </h3>
                                        <p className="text-sm font-medium text-blue-400">{app.jobs?.title || "Role"}</p>
                                        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Play Button Overlay */}
                                    {(app.video_url || app.seekers?.intro_video_url) && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-white/20">
                                            <Play className="ml-0.5 h-5 w-5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Detail Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row">

                        <button
                            onClick={() => setSelectedApp(null)}
                            className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-white/20 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Left Column: Video Player */}
                        <div className="w-full md:w-5/12 bg-black flex items-center justify-center relative">
                            {/* Priority: Application Video -> Profile Video -> Placeholder */}
                            {selectedApp.video_url || seekerProfile?.intro_video_url ? (
                                <video
                                    src={selectedApp.video_url || seekerProfile?.intro_video_url}
                                    controls
                                    autoPlay
                                    className="max-h-full max-w-full"
                                />
                            ) : (
                                <div className="text-center p-10">
                                    <User className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-500">No Video Provided</p>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Interaction */}
                        <div className="w-full md:w-7/12 flex flex-col bg-slate-900 border-l border-white/5">

                            {/* Header */}
                            <div className="p-6 border-b border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {seekerProfile?.full_name || "Applicant"}
                                        </h2>
                                        <p className="text-blue-400 font-medium">Applying for {selectedApp.jobs?.title || "Role"}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate('rejected')}
                                            className={clsx("p-2 rounded-full border transition", selectedApp.status === 'rejected' ? "bg-red-500 text-white border-red-500" : "border-white/10 text-slate-400 hover:text-red-400")}
                                        >
                                            <XCircle className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('interviewing')}
                                            className={clsx("p-2 rounded-full border transition", (selectedApp.status === 'interviewing' || selectedApp.status === 'accepted') ? "bg-green-500 text-black border-green-500" : "border-white/10 text-slate-400 hover:text-green-400")}
                                        >
                                            <CheckCircle className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-6 px-6 border-b border-white/5">
                                <button onClick={() => setActiveTab('profile')} className={clsx("py-4 text-sm font-bold border-b-2 transition", activeTab === 'profile' ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300")}>
                                    Profile & Info
                                </button>
                                <button onClick={() => setActiveTab('resume')} className={clsx("py-4 text-sm font-bold border-b-2 transition", activeTab === 'resume' ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300")}>
                                    Resume
                                </button>
                                <button onClick={() => setActiveTab('messages')} className={clsx("py-4 text-sm font-bold border-b-2 transition", activeTab === 'messages' ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300")}>
                                    Messages
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">

                                {activeTab === 'profile' && (
                                    <div className="space-y-6 animate-fade-in">
                                        {seekerProfile ? (
                                            <>
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Bio</h4>
                                                    <p className="text-slate-300 text-sm leading-relaxed">{seekerProfile.bio || "No bio available."}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Skills</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {seekerProfile.skills && Array.isArray(seekerProfile.skills) && seekerProfile.skills.map((s: string) => (
                                                            <span key={s} className="px-2 py-1 bg-white/5 rounded text-xs text-slate-300 border border-white/5">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-10 text-slate-500">
                                                <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                                <p>Loading profile...</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'resume' && (
                                    <div className="h-full animate-fade-in flex flex-col">
                                        {/* Priority: Application Resume -> Profile Resume */}
                                        {selectedApp.resume_url || seekerProfile?.resume_stats?.url ? (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                                <div className="p-10 bg-white/5 rounded-2xl flex flex-col items-center">
                                                    <FileText className="h-16 w-16 text-blue-400 mb-4" />
                                                    <p className="text-white font-bold mb-2">
                                                        {selectedApp.resume_url ? "Application Resume" : "Profile Resume"}
                                                    </p>
                                                    <a
                                                        href={selectedApp.resume_url || seekerProfile?.resume_stats?.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-6 py-2 bg-blue-600 rounded-full text-white text-sm font-bold hover:bg-blue-500 transition"
                                                    >
                                                        View / Download PDF
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
                                                <FileText className="h-10 w-10 mb-2 opacity-50" />
                                                <p>No Resume Uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'messages' && (
                                    <div className="h-full flex flex-col animate-fade-in">
                                        <div className="flex-1 space-y-4 mb-4 pr-2">
                                            {messages.length === 0 && (
                                                <p className="text-center text-slate-600 text-sm mt-10">Start the conversation...</p>
                                            )}
                                            {messages.map((msg) => (
                                                <div key={msg.id} className={clsx("flex flex-col max-w-[80%]", msg.senderId === 'employer' ? "ml-auto items-end" : "items-start")}>
                                                    <div className={clsx("rounded-2xl px-4 py-2 text-sm", msg.senderId === 'employer' ? "bg-blue-600 text-white" : "bg-white/10 text-slate-200")}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[10px] text-slate-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        <form onSubmit={handleSendMessage} className="relative mt-auto">
                                            <input
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type a message..."
                                                className="w-full bg-slate-950 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:border-blue-500 focus:outline-none"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim()}
                                                className="absolute right-1 top-1 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-0 transition"
                                            >
                                                <Send className="h-4 w-4" />
                                            </button>
                                        </form>
                                        <p className="text-[10px] text-center text-slate-600 mt-2">* Messaging is simulated in MVP.</p>
                                    </div>
                                )}

                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
