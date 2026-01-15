"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Globe, MapPin, Briefcase } from "lucide-react";
import JobCard from "@/components/JobCard";

export default function PublicCompanyProfile() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [company, setCompany] = useState<any>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchCompanyData();
        }
    }, [params.id]);

    const fetchCompanyData = async () => {
        try {
            // 1. Fetch Company Info
            const { data: companyData, error: companyError } = await supabase
                .from('employers')
                .select('*')
                .eq('id', params.id)
                .single();

            if (companyError) throw companyError;
            setCompany(companyData);

            // 2. Fetch Active Jobs
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .eq('employer_id', params.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (jobsData) {
                // Transform for JobCard
                const formattedJobs = jobsData.map((job: any) => ({
                    id: job.id,
                    title: job.title,
                    location: job.location,
                    salary: job.salary_range,
                    type: job.job_type,
                    company: companyData.company_name, // redundant but needed for card generic props
                    logo: companyData.company_logo_url,
                    employerId: companyData.id,
                    tags: job.requirements || [],
                    postedAt: new Date(job.created_at).toLocaleDateString()
                }));
                setJobs(formattedJobs);
            }

        } catch (error) {
            console.error("Error fetching company profile:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
    if (!company) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Company not found</div>;

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 pb-20">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
                    <button
                        onClick={() => router.back()}
                        className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-bold text-slate-400">Back</span>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">

                {/* Hero */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                    <div className="h-32 w-32 rounded-3xl bg-white p-2 shadow-2xl overflow-hidden shrink-0">
                        {company.company_logo_url ? (
                            <img src={company.company_logo_url} alt={company.company_name} className="h-full w-full object-contain" />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                                {company.company_name[0]}
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">{company.company_name}</h1>
                        {company.website && (
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium bg-blue-500/10 px-4 py-1.5 rounded-full transition">
                                <Globe className="h-4 w-4" /> {company.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid gap-8 md:grid-cols-3">

                    {/* Left: About & Video */}
                    <div className="md:col-span-2 space-y-8">
                        {company.company_video_url && (
                            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-video bg-black">
                                <video src={company.company_video_url} controls className="w-full h-full" />
                            </div>
                        )}

                        <div className="glass rounded-3xl p-8 space-y-6">
                            {company.mission && (
                                <div>
                                    <h3 className="text-sm font-bold uppercase text-slate-500 mb-3">Our Mission</h3>
                                    <p className="text-lg text-white leading-relaxed font-light">"{company.mission}"</p>
                                </div>
                            )}

                            {company.culture_description && (
                                <div className="pt-6 border-t border-white/5">
                                    <h3 className="text-sm font-bold uppercase text-slate-500 mb-3">Culture & Values</h3>
                                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">{company.culture_description}</p>
                                </div>
                            )}
                            {!company.mission && !company.culture_description && (
                                <p className="text-slate-500 italic">No additional information provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Right: Active Jobs */}
                    <div className="space-y-6">
                        <div className="glass rounded-3xl p-6">
                            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-blue-400" />
                                Active Openings
                            </h3>

                            {jobs.length === 0 ? (
                                <p className="text-slate-500 text-sm">No active jobs at the moment.</p>
                            ) : (
                                <div className="space-y-4">
                                    {jobs.map(job => (
                                        <div key={job.id} onClick={() => router.push(`/jobs/${job.id}`)} className="cursor-pointer group block bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition">
                                            <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition">{job.title}</h4>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                                <MapPin className="h-3 w-3" /> {job.location}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}
