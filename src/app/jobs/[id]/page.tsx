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

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center text-black">Loading...</div>;
    if (!job) return <div className="min-h-screen bg-white flex items-center justify-center text-zinc-500">Job not found</div>;

    return (
        <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-200 pb-20 text-black">
            <div className="fixed inset-0 bg-white pointer-events-none z-0" />

            <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-6">
                    <button
                        onClick={() => router.back()}
                        className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-black transition"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-bold text-zinc-500">Back to Jobs</span>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">

                {/* Hero Section */}
                <div className="mb-10 text-center">
                    <div
                        onClick={() => job.employer_id && router.push(`/companies/${job.employer_id}`)}
                        className={`mx-auto mb-6 h-20 w-20 rounded-2xl ${job.logo ? 'bg-transparent' : 'bg-black'} flex items-center justify-center text-3xl font-bold text-white shadow-xl border border-zinc-200 overflow-hidden cursor-pointer hover:opacity-80 transition`}
                    >
                        {job.logo ? <img src={job.logo} alt={job.company} className="h-full w-full object-cover" /> : job.company[0]}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight mb-2">{job.title}</h1>
                    <p
                        onClick={() => job.employer_id && router.push(`/companies/${job.employer_id}`)}
                        className="text-xl text-zinc-500 font-medium hover:text-black cursor-pointer transition"
                    >
                        {job.company}
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-zinc-600">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
                            <MapPin className="h-4 w-4 text-zinc-500" /> {job.location}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
                            <DollarSign className="h-4 w-4 text-green-600" /> {job.salary}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
                            <Clock className="h-4 w-4 text-purple-600" /> {job.type}
                        </div>
                    </div>
                </div>

                <div className="grid gap-10 md:grid-cols-3">

                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">

                        <div className="glass rounded-3xl p-8 border border-zinc-200 bg-white">
                            <h2 className="text-lg font-bold text-black mb-4">About the Role</h2>
                            <p className="text-zinc-600 leading-relaxed text-sm whitespace-pre-line">
                                {job.description || "No description provided."}
                            </p>
                        </div>

                        {job.responsibilities && job.responsibilities.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-black mb-4">What You'll Do</h3>
                                <ul className="space-y-3">
                                    {job.responsibilities.map((item: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-zinc-600 text-sm">
                                            <div className="mt-1 h-5 w-5 bg-black/5 rounded-full flex items-center justify-center shrink-0">
                                                <div className="h-1.5 w-1.5 bg-black rounded-full" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {job.requirements && job.requirements.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-black mb-4">Requirements</h3>
                                <ul className="space-y-3">
                                    {job.requirements.map((item: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-zinc-600 text-sm">
                                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </div>

                    {/* Sidebar / Actions */}
                    <div className="space-y-6">
                        <div className="glass rounded-3xl p-6 sticky top-24 border border-zinc-200 bg-white">
                            <h3 className="text-black font-bold mb-4">Ready to Apply?</h3>
                            <p className="text-xs text-zinc-500 mb-6">
                                Prepare your video intro and resume. Show us who you are beyond the paper.
                            </p>

                            <button
                                onClick={() => router.push(`/apply?jobId=${job.id}`)}
                                className="w-full rounded-xl bg-black py-4 font-bold text-white shadow-lg shadow-black/10 transition hover:shadow-black/20 hover:scale-[1.02] active:scale-95"
                            >
                                Apply Now
                            </button>

                            {job.tags && job.tags.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-zinc-100 space-y-2">
                                    <p className="text-xs text-zinc-500 font-bold uppercase">Tech Stack</p>
                                    <div className="flex flex-wrap gap-2">
                                        {job.tags.map((tag: string) => (
                                            <span key={tag} className="px-2 py-1 bg-zinc-50 rounded text-[10px] font-bold text-zinc-600 border border-zinc-200">
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
