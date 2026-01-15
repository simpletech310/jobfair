"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, MapPin, DollarSign, Briefcase, CheckCircle, Clock } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function JobDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (params.id) {
            async function fetchJob() {
                const { data, error } = await supabase
                    .from('jobs')
                    .select(`
                        *,
                        employer_id,
                        employers (
                            company_name,
                            company_logo_url
                        )
                    `)
                    .eq('id', params.id)
                    .single();

                if (data) {
                    const employer = Array.isArray(data.employers) ? data.employers[0] : data.employers;
                    setJob({
                        ...data,
                        employer_id: data.employer_id,
                        company: employer?.company_name || 'Unknown Company',
                        logo: employer?.company_logo_url,
                        salary: data.salary_range,
                        type: data.job_type,
                        tags: [] // Schema doesn't have tags yet, defaulting to empty
                    });
                } else {
                    console.error(error);
                }
                setLoading(false);
            }
            fetchJob();
        }
    }, [params.id]);

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500">Loading...</div>;
    if (!job) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Job not found</div>;

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30 pb-20">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

            <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-6">
                    <button
                        onClick={() => router.back()}
                        className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-bold text-slate-400">Back to Jobs</span>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">

                {/* Hero Section */}
                <div className="mb-10 text-center">
                    <div
                        onClick={() => job.employer_id && router.push(`/companies/${job.employer_id}`)}
                        className={`mx-auto mb-6 h-20 w-20 rounded-2xl ${job.logo ? 'bg-transparent' : 'bg-blue-500'} flex items-center justify-center text-3xl font-bold text-white shadow-2xl overflow-hidden cursor-pointer hover:opacity-80 transition`}
                    >
                        {job.logo ? <img src={job.logo} alt={job.company} className="h-full w-full object-cover" /> : job.company[0]}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">{job.title}</h1>
                    <p
                        onClick={() => job.employer_id && router.push(`/companies/${job.employer_id}`)}
                        className="text-xl text-slate-400 font-medium hover:text-blue-400 cursor-pointer transition"
                    >
                        {job.company}
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-300">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                            <MapPin className="h-4 w-4 text-blue-400" /> {job.location}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                            <DollarSign className="h-4 w-4 text-green-400" /> {job.salary}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                            <Clock className="h-4 w-4 text-purple-400" /> {job.type}
                        </div>
                    </div>
                </div>

                <div className="grid gap-10 md:grid-cols-3">

                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">

                        <div className="glass rounded-3xl p-8">
                            <h2 className="text-lg font-bold text-white mb-4">About the Role</h2>
                            <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">
                                {job.description || "No description provided."}
                            </p>
                        </div>

                        {job.responsibilities && job.responsibilities.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4">What You'll Do</h3>
                                <ul className="space-y-3">
                                    {job.responsibilities.map((item: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-slate-300 text-sm">
                                            <div className="mt-1 h-5 w-5 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                                                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {job.requirements && job.requirements.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>
                                <ul className="space-y-3">
                                    {job.requirements.map((item: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-slate-300 text-sm">
                                            <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </div>

                    {/* Sidebar / Actions */}
                    <div className="space-y-6">
                        <div className="glass rounded-3xl p-6 sticky top-24">
                            <h3 className="text-white font-bold mb-4">Ready to Apply?</h3>
                            <p className="text-xs text-slate-400 mb-6">
                                Prepare your video intro and resume. Show us who you are beyond the paper.
                            </p>

                            <button
                                onClick={() => router.push(`/apply?jobId=${job.id}`)}
                                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 font-bold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95"
                            >
                                Apply Now
                            </button>

                            {job.tags && job.tags.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
                                    <p className="text-xs text-slate-500 font-bold uppercase">Tech Stack</p>
                                    <div className="flex flex-wrap gap-2">
                                        {job.tags.map((tag: string) => (
                                            <span key={tag} className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-slate-300 border border-white/5">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}
