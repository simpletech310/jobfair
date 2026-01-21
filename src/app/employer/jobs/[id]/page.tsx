"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft,
    Briefcase,
    MapPin,
    DollarSign,
    Clock,
    Users,
    Building,
    CheckCircle2,
    XCircle,
    PauseCircle,
    Edit,
    Trash2,
    MessageSquare,
    FileText
} from "lucide-react";
import ApplicationDetailModal from "@/components/ApplicationDetailModal";
import { useMessages } from "@/hooks/useMessages";
import { clsx } from "clsx";

export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const jobId = params.id as string;

    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [applicantCount, setApplicantCount] = useState(0);
    const [applications, setApplications] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any>(null);

    // Messages Logic
    const { messages, sendMessage } = useMessages(selectedApp?.id || null);
    const [newMessage, setNewMessage] = useState("");
    const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'messages'>('profile');
    const [user, setUser] = useState<any>(null); // For messages context

    // Auth Check
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();
    }, []);

    // Load messages when app is selected
    // Manual fetch removed.

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedApp || !user) return;

        await sendMessage(newMessage); // arguments handled by hook closure
        setNewMessage("");
    };

    const handleAppStatusUpdate = async (status: 'interviewing' | 'rejected') => {
        if (!selectedApp) return;
        const { error } = await supabase.from('applications').update({ status }).eq('id', selectedApp.id);
        if (!error) {
            setSelectedApp({ ...selectedApp, status });
            setApplications(applications.map(a => a.id === selectedApp.id ? { ...a, status } : a));
        }
    };


    useEffect(() => {
        loadJob();
    }, [jobId]);

    const loadJob = async () => {
        try {
            setLoading(true);
            const { data: jobData, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) throw error;
            setJob(jobData);

            // Get applicant count
            const { count, error: countError } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('job_id', jobId);

            // Get actual applications with profiles
            const { data: apps, error: appsError } = await supabase
                .from('applications')
                .select('*, seekers(*), jobs(title)')
                .eq('job_id', jobId)
                .order('created_at', { ascending: false });

            if (!countError) setApplicantCount(count || 0);
            if (!appsError) setApplications(apps || []);

            if (!countError) setApplicantCount(count || 0);

        } catch (error) {
            console.error("Error loading job:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!job) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('jobs')
                .update({
                    status: newStatus,
                    // Auto-sync is_active for backward compatibility
                    is_active: newStatus === 'open'
                })
                .eq('id', jobId);

            if (error) throw error;

            setJob({ ...job, status: newStatus, is_active: newStatus === 'open' });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteJob = async () => {
        if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;
        setUpdating(true);
        // Note: Hard delete might fail if foreign keys exist (applications). 
        // We'll try hard delete, if it fails, we typically soft delete (status=closed/deleted).
        // Since we have a 'closed' status, maybe just force close? 
        // But user asked for delete. Let's try direct delete first (works if valid cascade).
        // If not cascade, we must delete apps first.
        try {
            // Option: cascading delete manually since Supabase FK might not cascade by default
            await supabase.from('applications').delete().eq('job_id', jobId); // Hazardous if we want to keep history?

            const { error } = await supabase.from('jobs').delete().eq('id', jobId);
            if (error) throw error;
            router.push('/employer');
        } catch (error) {
            console.error(error);
            alert("Failed to delete job. It may have active dependencies.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading...</div>;
    if (!job) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Job not found</div>;

    const statusOptions = [
        { value: 'open', label: 'Open', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
        { value: 'filled', label: 'Position Filled', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { value: 'on_hold', label: 'On Hold', icon: PauseCircle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
        { value: 'closed', label: 'Closed', icon: XCircle, color: 'text-zinc-600 bg-zinc-100 border-zinc-200' },
    ];

    const currentStatus = statusOptions.find(s => s.value === (job.status || 'open')) || statusOptions[0];

    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-black pb-24 selection:bg-zinc-200">
            <div className="fixed inset-0 bg-white pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/employer')}
                            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-black transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="h-6 w-px bg-zinc-200" />
                        <h1 className="text-lg font-bold text-black tracking-tight">Job Details</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={clsx("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2", currentStatus.color)}>
                            <currentStatus.icon className="h-3 w-3" />
                            {currentStatus.label}
                        </span>
                    </div>
                </div>
            </header>

            <main className="relative mx-auto max-w-6xl p-8 z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Main Details */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass rounded-2xl p-8 bg-white border border-zinc-200 shadow-sm">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-black mb-2">{job.title}</h1>
                                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                                        <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {job.company_name || "Company"}</span>
                                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Posted {new Date(job.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={() => router.push(`/employer/jobs/${jobId}/edit`)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-bold text-black hover:bg-zinc-50 transition"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit Job
                                </button>
                                <button
                                    onClick={handleDeleteJob}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-sm font-bold text-red-600 hover:bg-red-50 transition"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-8">
                                <span className="px-3 py-1 rounded-lg bg-zinc-100 text-sm font-medium border border-zinc-200">{job.job_type}</span>
                                <span className="px-3 py-1 rounded-lg bg-zinc-100 text-sm font-medium border border-zinc-200">{job.salary_range}</span>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-black mb-3">Description</h3>
                                    <div className="text-zinc-600 whitespace-pre-wrap leading-relaxed">{job.description}</div>
                                </div>
                                {job.requirements && job.requirements.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-black mb-3">Requirements</h3>
                                        <ul className="list-disc list-inside space-y-1 text-zinc-600">
                                            {job.requirements.map((req: string, i: number) => (
                                                <li key={i}>{req}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right: Sidebar / Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Status Management */}
                        <div className="glass rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm">
                            <h3 className="font-bold text-black mb-4">Job Status</h3>
                            <div className="space-y-2">
                                {statusOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleStatusUpdate(opt.value)}
                                        disabled={updating}
                                        className={clsx(
                                            "w-full flex items-center justify-between p-3 rounded-xl border transition text-sm font-medium",
                                            (job.status || 'open') === opt.value
                                                ? "bg-black text-white border-black"
                                                : "bg-white border-zinc-200 text-zinc-600 hover:border-black hover:text-black"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <opt.icon className="h-4 w-4" />
                                            {opt.label}
                                        </div>
                                        {(job.status || 'open') === opt.value && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Applicants List */}
                        <div className="glass rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm">
                            <h2 className="text-xl font-bold text-black mb-6">Applicants</h2>
                            {applications.length === 0 ? (
                                <p className="text-zinc-500">No applicants yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {applications.map((app) => (
                                        <div
                                            key={app.id}
                                            onClick={() => setSelectedApp(app)}
                                            className="flex flex-col gap-2 p-3 rounded-xl border border-zinc-100 bg-zinc-50 hover:border-black/20 hover:shadow-sm cursor-pointer transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                                                    {app.seekers?.avatar_url ? (
                                                        <img src={app.seekers.avatar_url} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Users className="h-4 w-4 text-zinc-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-black text-sm truncate">{app.seekers?.full_name || "Applicant"}</h4>
                                                    <p className="text-xs text-zinc-500 truncate">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    app.status === 'accepted' || app.status === 'interviewing' ? "bg-green-100 text-green-700" :
                                                        app.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-zinc-200 text-zinc-600"
                                                )}>
                                                    {app.status}
                                                </span>
                                                <ArrowLeft className="h-3 w-3 rotate-180 text-zinc-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {selectedApp && (
                <ApplicationDetailModal
                    app={selectedApp}
                    onClose={() => setSelectedApp(null)}
                    onStatusUpdate={handleAppStatusUpdate}
                    messages={messages}
                    newMessage={newMessage}
                    onSendMessage={handleSendMessage}
                    setNewMessage={setNewMessage}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    user={user}
                />
            )}
        </div>
    );
}
