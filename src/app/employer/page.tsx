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
    Users,
    MessageSquare,
    LogOut,
    Menu,
    ChevronRight,
    Search as SearchIcon,
    Building
} from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

import { useMessages } from "@/hooks/useMessages";

export default function EmployerDashboard() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const supabase = createClient();

    // View State
    const [currentView, setCurrentView] = useState<'dashboard' | 'jobs' | 'candidates' | 'search' | 'messages'>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Data State
    const [applications, setApplications] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [allSeekers, setAllSeekers] = useState<any[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [jobFilter, setJobFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [seekerSearchQuery, setSeekerSearchQuery] = useState("");

    // Modal State
    const [selectedApp, setSelectedApp] = useState<any | null>(null); // For Applications
    const [selectedSeeker, setSelectedSeeker] = useState<any | null>(null); // For Global Search
    const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'messages'>('profile');

    // Message State
    const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
    const { messages, sendMessage: sendHookMessage } = useMessages(selectedConversation?.id || null);
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

    // Removed Mock Effect

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
                    seekers (full_name, intro_video_url, avatar_url, title, skills, bio, experience_years, resume_stats)
                `)
                .order('created_at', { ascending: false });

            if (appError) throw appError;
            setApplications(apps || []);

            // 3. Get All Seekers (for Discovery)
            const { data: seekers, error: seekerError } = await supabase
                .from('seekers')
                .select('*')
                .limit(50);

            if (!seekerError) {
                setAllSeekers(seekers || []);
            }

            // 4. Get Conversations
            await fetchConversations();

        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversations = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                seekers (id, full_name, avatar_url, title)
            `)
            .eq('employer_id', user.id)
            .order('updated_at', { ascending: false });

        if (!error) {
            setConversations(data || []);
        }
    };

    const handleMessageCandidate = async (seekerId: string, jobId: string | null = null) => {
        if (!user) return;

        // Check if conversation exists (simplified check, Ideally check logic should match unique constraint)
        // For MVP, simplistic check on frontend list or just try create
        let conv = conversations.find(c => c.seeker_id === seekerId);

        if (!conv) {
            // Create New
            const { data, error } = await supabase
                .from('conversations')
                .insert({
                    employer_id: user.id,
                    seeker_id: seekerId,
                    job_id: jobId // Context
                })
                .select()
                .single();

            if (error) {
                // If unique violation, likely already exists, simplistic fallback fetch (race condition edge case)
                console.error("Error creating conversation", error);
                await fetchConversations(); // refresh
                conv = conversations.find(c => c.seeker_id === seekerId); // Try find again
            } else {
                conv = data;
                await fetchConversations(); // Refresh list
            }
        }

        if (conv) {
            // Setup local conv object with seeker details if creating new (optimization: ensure full fetch)
            // If we just created it, we might need to fetch the seeker details again or optimistically attach them
            if (!conv.seekers) {
                const s = allSeekers.find(x => x.id === seekerId) || applications.find(a => a.seeker_id === seekerId)?.seekers;
                conv.seekers = s;
            }

            setCurrentView('messages');
            setSelectedConversation(conv);
            setSelectedApp(null);
            setSelectedSeeker(null);
        }
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        await sendHookMessage(newMessage);
        setNewMessage("");

        // Update conversation list timestamp (optimistic)
        setConversations(prev => {
            const others = prev.filter(c => c.id !== selectedConversation.id);
            const updated = prev.find(c => c.id === selectedConversation.id);
            if (updated) updated.updated_at = new Date().toISOString(); // simplistic
            return updated ? [updated, ...others] : prev;
        })
    };

    // --- Derived Data ---
    const filteredApplications = applications.filter(app => {
        if (jobFilter !== 'all' && app.job_id !== jobFilter) return false;
        if (statusFilter !== 'all' && app.status !== statusFilter) return false;
        return true;
    });

    const filteredSeekers = allSeekers.filter(s => {
        if (!seekerSearchQuery) return true;
        const q = seekerSearchQuery.toLowerCase();
        return (
            (s.full_name?.toLowerCase().includes(q)) ||
            (s.title?.toLowerCase().includes(q)) ||
            (s.skills?.some((sk: string) => sk.toLowerCase().includes(q)))
        );
    });

    // Stats
    const totalApplicants = applications.length;
    const shortlistedCount = applications.filter(a => a.status === 'interviewing' || a.status === 'accepted').length;
    const activeJobsCount = jobs.filter(j => j.is_active).length;

    if (authLoading || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'jobs', label: 'My Jobs', icon: Briefcase },
        { id: 'candidates', label: 'Applications', icon: Users },
        { id: 'search', label: 'Find Candidates', icon: SearchIcon },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 flex text-slate-200">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none z-0" />

            {/* --- SIDEBAR --- */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-950/90 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 md:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-white/5">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30 mr-3">J</div>
                        <span className="text-lg font-bold text-white tracking-tight">JobFair</span>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setCurrentView(item.id as any); setIsSidebarOpen(false); }}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    currentView === item.id
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </button>
                        ))}
                        <button
                            onClick={() => router.push('/employer/profile')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                        >
                            <Building className="h-5 w-5" />
                            Company Profile
                        </button>
                    </nav>

                    {/* User */}
                    <div className="p-4 border-t border-white/5">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 mb-2">
                            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                                <User className="h-4 w-4 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                                <p className="text-xs text-slate-500">Employer</p>
                            </div>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-400 transition"
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

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-64 relative z-10 flex flex-col min-h-screen">

                {/* Mobile Header */}
                <header className="md:hidden h-16 flex items-center justify-between px-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400">
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="text-lg font-bold text-white">
                        {navItems.find(i => i.id === currentView)?.label}
                    </span>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full flex-1">

                    {/* --- DASHBOARD VIEW --- */}
                    {currentView === 'dashboard' && (
                        <div className="animate-fade-in space-y-8">
                            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
                                    <p className="text-slate-400">Here's what's happening with your jobs today.</p>
                                </div>
                                <button
                                    onClick={() => router.push("/employer/post-job")}
                                    className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
                                >
                                    <Plus className="h-4 w-4" /> Post New Job
                                </button>
                            </header>

                            {/* Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatsCard icon={Users} label="Total Applicants" value={totalApplicants} color="blue" />
                                <StatsCard icon={CheckCircle} label="Shortlisted" value={shortlistedCount} color="green" />
                                <StatsCard icon={Briefcase} label="Active Jobs" value={activeJobsCount} color="purple" />
                                <StatsCard icon={Clock} label="Pending Review" value={applications.filter(a => a.status === 'pending').length} color="orange" />
                            </div>

                            {/* Recent Activity */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white">Recent Applications</h2>
                                    <button onClick={() => setCurrentView('candidates')} className="text-sm text-blue-400 hover:text-blue-300">View All</button>
                                </div>

                                {applications.length === 0 ? (
                                    <EmptyState message="No applications yet." />
                                ) : (
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {applications.slice(0, 4).map(app => (
                                            <ApplicationCard
                                                key={app.id}
                                                app={app}
                                                onClick={() => setSelectedApp(app)}
                                                onMessage={() => handleMessageCandidate(app.seeker_id, app.job_id)}
                                            />
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
                                <h1 className="text-2xl font-bold text-white">My Jobs</h1>
                                <button
                                    onClick={() => router.push("/employer/post-job")}
                                    className="hidden md:flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition"
                                >
                                    <Plus className="h-4 w-4" /> New Job
                                </button>
                            </div>

                            {jobs.length === 0 ? (
                                <EmptyState
                                    icon={Briefcase}
                                    title="No Jobs Posted"
                                    message="Post your first job to start finding talent."
                                    action={{ label: "Create Job Post", onClick: () => router.push("/employer/post-job") }}
                                />
                            ) : (
                                <div className="grid gap-4">
                                    {jobs.map(job => (
                                        <JobRow
                                            key={job.id}
                                            job={job}
                                            stats={{
                                                applicants: applications.filter(a => a.job_id === job.id).length,
                                                new: applications.filter(a => a.job_id === job.id && a.status === 'pending').length
                                            }}
                                            onToggleStatus={() => toggleJobStatus(job.id, job.is_active)}
                                            onViewApplicants={() => { setJobFilter(job.id); setCurrentView('candidates'); }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- CANDIDATES (APPLICATIONS) VIEW --- */}
                    {currentView === 'candidates' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h1 className="text-2xl font-bold text-white">Applications</h1>

                                <div className="flex items-center gap-3">
                                    <select
                                        value={jobFilter}
                                        onChange={(e) => setJobFilter(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All Jobs</option>
                                        {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                                    </select>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="interviewing">Shortlisted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            {filteredApplications.length === 0 ? (
                                <EmptyState message="No candidates match your filters." />
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {filteredApplications.map(app => (
                                        <ApplicationCard
                                            key={app.id}
                                            app={app}
                                            onClick={() => setSelectedApp(app)}
                                            onMessage={() => handleMessageCandidate(app.seeker_id, app.job_id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- SEARCH (FIND CANDIDATES) VIEW --- */}
                    {currentView === 'search' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex flex-col gap-4">
                                <h1 className="text-2xl font-bold text-white">Find Candidates</h1>
                                <div className="relative">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, title, or skills..."
                                        value={seekerSearchQuery}
                                        onChange={(e) => setSeekerSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>

                            {filteredSeekers.length === 0 ? (
                                <EmptyState message={seekerSearchQuery ? "No candidates found matching your search." : "Start searching to find candidates."} />
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {filteredSeekers.map(seeker => (
                                        <SeekerCard
                                            key={seeker.id}
                                            seeker={seeker}
                                            onClick={() => setSelectedSeeker(seeker)}
                                            onMessage={() => handleMessageCandidate(seeker.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- MESSAGES VIEW --- */}
                    {currentView === 'messages' && (
                        <div className="animate-fade-in h-[calc(100vh-8rem)] flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            {/* Conversations List */}
                            <div className="w-1/3 border-r border-white/5 flex flex-col">
                                <div className="p-4 border-b border-white/5">
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Inbox</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {conversations.length === 0 && <div className="p-4 text-center text-slate-500 text-xs">No active conversations. Start one from Applications.</div>}
                                    {conversations.map(conv => (
                                        <div
                                            key={conv.id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={clsx(
                                                "p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition",
                                                selectedConversation?.id === conv.id ? "bg-blue-900/10 border-l-2 border-l-blue-500" : "border-l-2 border-l-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                                    {conv.seekers?.avatar_url ? (
                                                        <img src={conv.seekers.avatar_url} className="h-full w-full object-cover" />
                                                    ) : <User className="h-5 w-5 text-slate-300" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-white truncate">{conv.seekers?.full_name || "Unknown Candidate"}</h4>
                                                    <p className="text-xs text-slate-400 truncate">Click to view messages</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Conversation View */}
                            <div className="flex-1 flex flex-col bg-slate-950/30">
                                {selectedConversation ? (
                                    <>
                                        <div className="p-4 border-b border-white/5 flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                                                {selectedConversation.seekers?.avatar_url ? (
                                                    <img src={selectedConversation.seekers.avatar_url} className="h-8 w-8 rounded-full object-cover" />
                                                ) : <User className="h-4 w-4 text-slate-300" />}
                                            </div>
                                            <h3 className="font-bold text-white">{selectedConversation.seekers?.full_name || "Candidate"}</h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {messages.length === 0 && <div className="text-center text-slate-500 mt-10">Start the conversation...</div>}
                                            {messages.map((msg: any) => (
                                                <div key={msg.id} className={clsx("flex flex-col max-w-[80%]", msg.sender_id === user?.id ? "ml-auto items-end" : "items-start")}>
                                                    <div className={clsx("rounded-2xl px-4 py-2 text-sm", msg.sender_id === user?.id ? "bg-blue-600 text-white" : "bg-white/10 text-slate-200")}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[10px] text-slate-600 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-2">
                                            <input
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                            />
                                            <button type="submit" disabled={!newMessage.trim()} className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition">
                                                <Send className="h-4 w-4" />
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                        <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                                        <p>Select a conversation to start messaging</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* --- APP DETAIL MODAL --- */}
            {
                selectedApp && (
                    <ApplicationDetailModal
                        app={selectedApp}
                        onClose={() => setSelectedApp(null)}
                        onStatusUpdate={handleStatusUpdate}
                        messages={messages}
                        newMessage={newMessage}
                        onSendMessage={handleSendMessage}
                        setNewMessage={setNewMessage}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        messagesEndRef={messagesEndRef}
                    />
                )
            }

            {/* --- SEEKER PROFILE MODAL (FROM SEARCH) --- */}
            {
                selectedSeeker && (
                    <SeekerDetailModal
                        seeker={selectedSeeker}
                        onClose={() => setSelectedSeeker(null)}
                        onMessage={() => {
                            handleMessageCandidate(selectedSeeker.id);
                            // setSelectedSeeker(null); // handled inside handleMessage
                        }}
                    />
                )
            }

        </div >
    );
}

// --- Subcomponents ---

function StatsCard({ icon: Icon, label, value, color }: any) {
    const colors: any = {
        blue: "text-blue-400 bg-blue-500/10",
        green: "text-green-400 bg-green-500/10",
        purple: "text-purple-400 bg-purple-500/10",
        orange: "text-orange-400 bg-orange-500/10",
    };
    return (
        <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
                <div className={clsx("p-2 rounded-lg", colors[color])}><Icon className="h-5 w-5" /></div>
                <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
            </div>
            <p className="text-3xl font-extrabold text-white">{value}</p>
        </div>
    );
}

function EmptyState({ icon: Icon, title, message, action }: any) {
    return (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed flex flex-col items-center">
            {Icon && <Icon className="h-12 w-12 text-slate-600 mb-4" />}
            {title && <h3 className="text-lg font-bold text-white mb-2">{title}</h3>}
            <p className="text-slate-400 mb-6">{message}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-3 bg-blue-600 rounded-full text-white font-bold hover:bg-blue-500 transition"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}


// Updated Subcomponent Props
function ApplicationCard({ app, onClick, onMessage }: { app: any, onClick: () => void, onMessage: () => void }) {
    return (
        <div onClick={onClick} className="group glass-card relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/5 transition hover:-translate-y-1 hover:border-white/10">
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
                {!app.seekers?.intro_video_url && !app.video_url ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                        {app.seekers?.avatar_url ? (
                            <img src={app.seekers.avatar_url} alt={app.seekers.full_name} className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-12 w-12 text-slate-600" />
                        )}
                    </div>
                ) : (
                    <video
                        src={app.video_url || app.seekers?.intro_video_url}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        muted playsInline
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {/* Status Badge */}
                <div className="absolute top-2 right-2 flex gap-1">
                    {app.status === 'interviewing' && <span className="bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">SHORTLISTED</span>}
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-bold text-white truncate">{app.seekers?.full_name || "Applicant"}</h3>
                <p className="text-xs text-blue-400 truncate mb-2">{app.jobs?.title || "Role"}</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString()}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMessage(); }}
                        className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:bg-blue-600 hover:text-white transition"
                        title="Send Message"
                    >
                        <MessageSquare className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function SeekerCard({ seeker, onClick, onMessage }: { seeker: any, onClick: () => void, onMessage?: () => void }) {
    return (
        <div onClick={onClick} className="group glass-card relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/5 transition hover:-translate-y-1 hover:border-white/10">
            <div className="relative aspect-square w-full bg-slate-800 overflow-hidden">
                {seeker.intro_video_url ? (
                    <video src={seeker.intro_video_url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                        {seeker.avatar_url ? (
                            <img src={seeker.avatar_url} alt={seeker.full_name} className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-16 w-16 text-slate-600" />
                        )}
                    </div>
                )}
                {seeker.intro_video_url && <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition"><Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition" /></div>}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-white truncate">{seeker.full_name || "Job Seeker"}</h3>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 truncate">{seeker.title || "No Title"}</p>
                    {onMessage && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMessage(); }}
                            className="p-1 rounded-full bg-white/10 text-slate-400 hover:text-white hover:bg-blue-600 transition"
                        >
                            <MessageSquare className="h-3 w-3" />
                        </button>
                    )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                    {seeker.skills?.slice(0, 2).map((s: string) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 border border-white/5">{s}</span>
                    ))}
                    {seeker.skills?.length > 2 && <span className="text-[10px] text-slate-500">+{seeker.skills.length - 2}</span>}
                </div>
            </div>
        </div>
    );
}

function JobRow({ job, stats, onToggleStatus, onViewApplicants }: any) {
    return (
        <div className="glass rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5 hover:bg-white/5 transition">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white">{job.title}</h3>
                    <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold border", job.is_active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20")}>
                        {job.is_active ? "ACTIVE" : "CLOSED"}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>{job.location}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span>{job.job_type}</span>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-center px-4 border-l border-white/10">
                    <p className="text-xl font-bold text-white">{stats.applicants}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Applicants</p>
                </div>
                <div className="text-center px-4 border-l border-white/10">
                    <p className="text-xl font-bold text-blue-400">{stats.new}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500">New</p>
                </div>
            </div>
            <div className="flex items-center gap-2 pl-4 md:border-l border-white/10">
                <button onClick={onViewApplicants} className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition" title="View Applicants">
                    <Users className="h-5 w-5" />
                </button>
                <button onClick={onToggleStatus} className={clsx("p-2 rounded-lg transition", job.is_active ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10" : "text-green-400 hover:bg-green-500/10")} title={job.is_active ? "Close Job" : "Activate Job"}>
                    {job.is_active ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
}

function ApplicationDetailModal({ app, onClose, onStatusUpdate, messages, newMessage, onSendMessage, setNewMessage, activeTab, setActiveTab, messagesEndRef }: any) {
    const seekerProfile = app.seekers;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row">
                <button onClick={onClose} className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-white/20 transition"><X className="h-5 w-5" /></button>

                {/* Left: Media */}
                <div className="w-full md:w-5/12 bg-black flex items-center justify-center relative">
                    {app.video_url || seekerProfile?.intro_video_url ? (
                        <video src={app.video_url || seekerProfile?.intro_video_url} controls autoPlay className="max-h-full max-w-full" />
                    ) : (
                        <div className="text-center p-10"><User className="h-16 w-16 text-slate-700 mx-auto mb-4" /><p className="text-slate-500">No Video Provided</p></div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-7/12 flex flex-col bg-slate-900 border-l border-white/5">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{seekerProfile?.full_name || "Applicant"}</h2>
                                <p className="text-blue-400 font-medium">{app.jobs?.title || "Role"}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onStatusUpdate('rejected')} className={clsx("p-2 rounded-full border transition", app.status === 'rejected' ? "bg-red-500 text-white border-red-500" : "border-white/10 text-slate-400 hover:text-red-400")} title="Reject"><XCircle className="h-5 w-5" /></button>
                                <button onClick={() => onStatusUpdate('interviewing')} className={clsx("p-2 rounded-full border transition", (app.status === 'interviewing' || app.status === 'accepted') ? "bg-green-500 text-black border-green-500" : "border-white/10 text-slate-400 hover:text-green-400")} title="Shortlist"><CheckCircle className="h-5 w-5" /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6 px-6 border-b border-white/5">
                        {['profile', 'resume', 'messages'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={clsx("py-4 text-sm font-bold border-b-2 transition capitalize", activeTab === tab ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300")}>{tab}</button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-fade-in">
                                <div><h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Bio</h4><p className="text-slate-300 text-sm leading-relaxed">{seekerProfile?.bio || "No bio available."}</p></div>
                                <div><h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Skills</h4><div className="flex flex-wrap gap-2">{seekerProfile?.skills?.map((s: string) => <span key={s} className="px-2 py-1 bg-white/5 rounded text-xs text-slate-300 border border-white/5">{s}</span>)}</div></div>
                                <div><h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Experience</h4><p className="text-slate-300 font-bold">{seekerProfile?.experience_years || 0} Years</p></div>
                            </div>
                        )}
                        {activeTab === 'resume' && (
                            <div className="h-full animate-fade-in flex flex-col items-center justify-center">
                                {app.resume_url || seekerProfile?.resume_stats?.url ? (
                                    <div className="text-center">
                                        <FileText className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                                        <a href={app.resume_url || seekerProfile?.resume_stats?.url} target="_blank" rel="noopener" className="px-6 py-2 bg-blue-600 rounded-full text-white text-sm font-bold hover:bg-blue-500 transition">View / Download PDF</a>
                                    </div>
                                ) : <p className="text-slate-500">No Resume Uploaded</p>}
                            </div>
                        )}
                        {activeTab === 'messages' && (
                            <div className="h-full flex flex-col animate-fade-in">
                                <div className="flex-1 space-y-4 mb-4 pr-2">
                                    {messages.map((msg: any) => (
                                        <div key={msg.id} className={clsx("flex flex-col max-w-[80%]", msg.senderId === 'employer' ? "ml-auto items-end" : "items-start")}>
                                            <div className={clsx("rounded-2xl px-4 py-2 text-sm", msg.senderId === 'employer' ? "bg-blue-600 text-white" : "bg-white/10 text-slate-200")}>{msg.content}</div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={onSendMessage} className="relative mt-auto">
                                    <div className="relative"><input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-slate-950 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:border-blue-500 focus:outline-none" /><button type="submit" disabled={!newMessage.trim()} className="absolute right-1 top-1 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-0 transition"><Send className="h-4 w-4" /></button></div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function SeekerDetailModal({ seeker, onClose, onMessage }: any) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-white">Candidate Details</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                            {seeker.avatar_url ? (
                                <img src={seeker.avatar_url} className="h-full w-full object-cover" />
                            ) : <User className="h-8 w-8 text-slate-500" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{seeker.full_name}</h2>
                            <p className="text-slate-400">{seeker.title}</p>
                        </div>
                    </div>

                    {seeker.intro_video_url && (
                        <div className="rounded-xl overflow-hidden bg-black aspect-video">
                            <video src={seeker.intro_video_url} controls className="w-full h-full" />
                        </div>
                    )}

                    <div>
                        <h4 className="font-bold text-slate-500 text-xs uppercase mb-2">About</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">{seeker.bio || "No bio."}</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-500 text-xs uppercase mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                            {seeker.skills?.map((s: string) => (
                                <span key={s} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-slate-300">{s}</span>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Footer */}
                <div className="p-4 border-t border-white/5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-white/5 pointer-events-auto">Close</button>
                    <button
                        onClick={onMessage}
                        className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
                    >
                        Message Candidate
                    </button>
                </div>
            </div>
        </div>
    );
}

