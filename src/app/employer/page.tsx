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
    Loader2,
    Briefcase,
    Search,
    Filter,
    MoreHorizontal,
    LayoutDashboard,
    Users
} from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

export default function EmployerDashboard() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const supabase = createClient();

    // View State
    const [currentView, setCurrentView] = useState<'dashboard' | 'jobs' | 'candidates'>('dashboard');

    // Data State
    const [applications, setApplications] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [jobFilter, setJobFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modal State
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'messages'>('profile');
    const [seekerProfile, setSeekerProfile] = useState<any>(null);

    // Message State (Mock for MVP)
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/auth');
            } else {
                loadData();
            }
        }
    }, [user, authLoading]);

    useEffect(() => {
        if (selectedApp) {
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
            setLoading(true);

            // 1. Get Employer's Jobs
            const { data: jobList, error: jobError } = await supabase
                .from('jobs')
                .select('*')
                .eq('employer_id', user.id)
                .order('created_at', { ascending: false });

            if (jobError) throw jobError;
            setJobs(jobList || []);

            // 2. Get Applications
            const { data: apps, error: appError } = await supabase
                .from('applications')
                .select(`
                    *,
                    jobs (title),
                    seekers (full_name, intro_video_url)
                `)
                .order('created_at', { ascending: false });

            if (appError) throw appError;
            setApplications(apps || []);

        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadSeekerProfile = async (seekerId: string) => {
        const { data } = await supabase
            .from('seekers')
            .select('*')
            .eq('id', seekerId)
            .single();

        if (data) setSeekerProfile(data);
    };

    const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
        // Optimistic update
        setJobs(jobs.map(j => j.id === jobId ? { ...j, is_active: !currentStatus } : j));

        const { error } = await supabase
            .from('jobs')
            .update({ is_active: !currentStatus })
            .eq('id', jobId);

        if (error) {
            // Revert
            setJobs(jobs.map(j => j.id === jobId ? { ...j, is_active: currentStatus } : j));
            alert("Failed to update status");
        }
    };

    const handleStatusUpdate = async (status: 'interviewing' | 'rejected') => {
        if (!selectedApp) return;

        const { error } = await supabase
            .from('applications')
            .update({ status })
            .eq('id', selectedApp.id);

        if (error) {
            alert("Failed to update status");
            return;
        }

        setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status } : a));
        setSelectedApp((prev: any) => prev ? { ...prev, status } : null);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedApp) return;

        const msg = {
            id: crypto.randomUUID(),
            senderId: 'employer',
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        setMessages([...messages, msg]);
        setNewMessage("");
    };

    // --- Derived Data ---
    const filteredApplications = applications.filter(app => {
        if (jobFilter !== 'all' && app.job_id !== jobFilter) return false;
        if (statusFilter !== 'all' && app.status !== statusFilter) return false;
        return true;
    });

    // Stats
    const totalApplicants = applications.length;
    const shortlistedCount = applications.filter(a => a.status === 'interviewing' || a.status === 'accepted').length;
    const activeJobsCount = jobs.filter(j => j.is_active).length;

    if (authLoading || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

            {/* Sidebar Navigation (Mobile: Bottom, Desktop: Left) */}
            {/* For MVP simplicity we'll keep Top Nav but adding a Sub-Nav or Sidebar is better. Let's use a nice Top Sub-Nav. */}

            <header className="sticky top-0 z-10 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">E</div>
                        <span className="text-lg font-bold text-white tracking-tight">Employer Dashboard</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-1">
                            <button
                                onClick={() => setCurrentView('dashboard')}
                                className={clsx("px-4 py-2 text-sm font-medium rounded-full transition", currentView === 'dashboard' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setCurrentView('jobs')}
                                className={clsx("px-4 py-2 text-sm font-medium rounded-full transition", currentView === 'jobs' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
                            >
                                My Jobs
                            </button>
                            <button
                                onClick={() => setCurrentView('candidates')}
                                className={clsx("px-4 py-2 text-sm font-medium rounded-full transition", currentView === 'candidates' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
                            >
                                Candidates
                            </button>
                        </nav>

                        <div className="h-6 w-px bg-white/10 hidden md:block" />

                        <button
                            onClick={() => router.push("/employer/post-job")}
                            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
                        >
                            <Plus className="h-4 w-4" /> Post Job
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative mx-auto max-w-7xl p-6">

                {/* --- DASHBOARD VIEW --- */}
                {currentView === 'dashboard' && (
                    <div className="animate-fade-in space-y-8">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="glass rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Users className="h-5 w-5" /></div>
                                    <p className="text-xs font-bold uppercase text-slate-500">Total Applicants</p>
                                </div>
                                <p className="text-3xl font-extrabold text-white">{totalApplicants}</p>
                            </div>
                            <div className="glass rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-green-500/10 text-green-400"><CheckCircle className="h-5 w-5" /></div>
                                    <p className="text-xs font-bold uppercase text-slate-500">Shortlisted</p>
                                </div>
                                <p className="text-3xl font-extrabold text-white">{shortlistedCount}</p>
                            </div>
                            <div className="glass rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Briefcase className="h-5 w-5" /></div>
                                    <p className="text-xs font-bold uppercase text-slate-500">Active Jobs</p>
                                </div>
                                <p className="text-3xl font-extrabold text-white">{activeJobsCount}</p>
                            </div>
                            <div className="glass rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400"><Clock className="h-5 w-5" /></div>
                                    <p className="text-xs font-bold uppercase text-slate-500">Pending Review</p>
                                </div>
                                <p className="text-3xl font-extrabold text-white">{applications.filter(a => a.status === 'pending').length}</p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Recent Applications</h2>
                                <button onClick={() => setCurrentView('candidates')} className="text-sm text-blue-400 hover:text-blue-300">View All</button>
                            </div>

                            {applications.length === 0 ? (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                                    <p className="text-slate-500">No applications yet.</p>
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    {applications.slice(0, 4).map(app => (
                                        <ApplicationCard key={app.id} app={app} onClick={() => setSelectedApp(app)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- JOBS VIEW --- */}
                {currentView === 'jobs' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">My Jobs</h2>
                            <button
                                onClick={() => router.push("/employer/post-job")}
                                className="md:hidden flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white"
                            >
                                <Plus className="h-4 w-4" /> New Job
                            </button>
                        </div>

                        {jobs.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                                <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">No Jobs Posted</h3>
                                <p className="text-slate-400 mb-6">Post your first job to start finding talent.</p>
                                <button
                                    onClick={() => router.push("/employer/post-job")}
                                    className="px-6 py-3 bg-blue-600 rounded-full text-white font-bold hover:bg-blue-500 transition"
                                >
                                    Create Job Post
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobs.map(job => {
                                    const appCount = applications.filter(a => a.job_id === job.id).length;
                                    const newCount = applications.filter(a => a.job_id === job.id && a.status === 'pending').length;

                                    return (
                                        <div key={job.id} className="glass rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition border border-white/5">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-white">{job.title}</h3>
                                                    {job.is_active ?
                                                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/20">ACTIVE</span>
                                                        :
                                                        <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-[10px] font-bold border border-slate-500/20">CLOSED</span>
                                                    }
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                                    <span>{job.location}</span>
                                                    <span>•</span>
                                                    <span>{job.job_type}</span>
                                                    <span>•</span>
                                                    <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-white">{appCount}</p>
                                                    <p className="text-[10px] uppercase font-bold text-slate-500">Applicants</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-blue-400">{newCount}</p>
                                                    <p className="text-[10px] uppercase font-bold text-slate-500">New</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                                                <button
                                                    onClick={() => { setJobFilter(job.id); setCurrentView('candidates'); }}
                                                    className="px-4 py-2 rounded-lg bg-white/5 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 transition"
                                                >
                                                    View Applicants
                                                </button>
                                                <button
                                                    onClick={() => toggleJobStatus(job.id, job.is_active)}
                                                    className={clsx("p-2 rounded-lg transition", job.is_active ? "text-red-400 hover:bg-red-500/10" : "text-green-400 hover:bg-green-500/10")}
                                                    title={job.is_active ? "Close Job" : "Reopen Job"}
                                                >
                                                    {job.is_active ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* --- CANDIDATES VIEW --- */}
                {currentView === 'candidates' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-white">Candidates</h2>

                            <div className="flex items-center gap-3">
                                {/* Job Filter */}
                                <div className="relative">
                                    <select
                                        value={jobFilter}
                                        onChange={(e) => setJobFilter(e.target.value)}
                                        className="appearance-none bg-slate-900 border border-white/10 rounded-lg py-2 pl-4 pr-10 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All Jobs</option>
                                        {jobs.map(j => (
                                            <option key={j.id} value={j.id}>{j.title}</option>
                                        ))}
                                    </select>
                                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                                </div>

                                {/* Status Filter */}
                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="appearance-none bg-slate-900 border border-white/10 rounded-lg py-2 pl-4 pr-10 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="interviewing">Shortlisted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {filteredApplications.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                                <p className="text-slate-500">No candidates match your filters.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {filteredApplications.map(app => (
                                    <ApplicationCard key={app.id} app={app} onClick={() => setSelectedApp(app)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* --- DETAIL MODAL --- */}
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
                                            title="Reject"
                                        >
                                            <XCircle className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('interviewing')}
                                            className={clsx("p-2 rounded-full border transition", (selectedApp.status === 'interviewing' || selectedApp.status === 'accepted') ? "bg-green-500 text-black border-green-500" : "border-white/10 text-slate-400 hover:text-green-400")}
                                            title="Shortlist"
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
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Experience</h4>
                                                    <p className="text-slate-300 font-bold">{seekerProfile.experience_years || 0} Years</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-10 text-slate-500">
                                                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
                                                <p>Loading profile...</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'resume' && (
                                    <div className="h-full animate-fade-in flex flex-col">
                                        {selectedApp.resume_url || seekerProfile?.resume_stats?.url ? (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                                <div className="p-10 bg-white/5 rounded-2xl flex flex-col items-center border border-white/5">
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
                                            <div className="relative">
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
                                            </div>
                                        </form>
                                        <p className="text-[10px] text-center text-slate-600 mt-2">* Messaging is simulated.</p>
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

// --- Subcomponents ---

function ApplicationCard({ app, onClick }: { app: any, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
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
    );
}
