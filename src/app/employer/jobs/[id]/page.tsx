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
    AlertCircle,
    CheckCircle2,
    XCircle,
    PauseCircle
} from "lucide-react";
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
                            onClick={() => router.back()}
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

                        {/* Stats */}
                        <div className="glass rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm">
                            <h3 className="font-bold text-black mb-4">Performance</h3>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-zinc-500" />
                                    <span className="text-sm font-medium text-zinc-600">Applicants</span>
                                </div>
                                <span className="text-2xl font-bold text-black">{applicantCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
