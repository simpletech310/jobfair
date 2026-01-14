"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import JobCard from "@/components/JobCard";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchJobs() {
            try {
                // Fetch jobs joined with employers to get company info
                const { data, error } = await supabase
                    .from('jobs')
                    .select(`
                        id,
                        title,
                        location,
                        salary_range,
                        job_type,
                        created_at,
                        employers (
                            company_name,
                            company_logo_url
                        )
                    `)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Transform to match JobCard expectation
                const formattedJobs = data.map((job: any) => {
                    const employer = Array.isArray(job.employers) ? job.employers[0] : job.employers;
                    return {
                        id: job.id,
                        title: job.title,
                        location: job.location,
                        salary: job.salary_range,
                        type: job.job_type,
                        company: employer?.company_name || 'Unknown Company',
                        logo: employer?.company_logo_url,
                        postedAt: new Date(job.created_at).toLocaleDateString()
                    };
                });

                setJobs(formattedJobs);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchJobs();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />
            <div className="fixed -top-32 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px] animate-blob" />

            <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">Job Fair</span>
                    </div>
                    <button
                        onClick={() => router.push("/employer")}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                        Employer Demo
                    </button>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight md:text-5xl">
                        Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Next Big Thing</span>
                    </h1>
                    <p className="mt-4 text-lg text-slate-400">Discover the world's most innovative companies.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {jobs.length > 0 ? (
                            jobs.map((job) => (
                                <JobCard key={job.id} job={job} />
                            ))
                        ) : (
                            <div className="col-span-2 text-center text-slate-500 py-10">
                                No jobs found. Check back later!
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
