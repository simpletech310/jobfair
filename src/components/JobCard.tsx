"use client";

import { MapPin, ArrowRight, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";

interface JobProps {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    tags: string[];
    logo: string; // Tailwind color class for placeholder or URL
    employerId?: string;
}

export default function JobCard({ job }: { job: JobProps }) {
    const router = useRouter();

    const handleCompanyClick = (e: React.MouseEvent) => {
        if (job.employerId) {
            e.stopPropagation();
            router.push(`/companies/${job.employerId}`);
        }
    };

    return (
        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 shadow-2xl backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white/10 hover:shadow-cyan-500/10">
            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    <div
                        onClick={handleCompanyClick}
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${job.logo.startsWith('http') ? 'bg-white p-1' : job.logo.replace("bg-", "from-").replace("500", "500").replace("600", "600") + ' to-slate-800'} shadow-lg cursor-pointer hover:opacity-80 transition`}
                    >
                        {job.logo.startsWith('http') ? (
                            <img src={job.logo} alt={job.company} className="h-full w-full object-contain rounded-lg" />
                        ) : (
                            <Briefcase className="h-6 w-6 text-white" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">{job.title}</h3>
                        <p
                            onClick={handleCompanyClick}
                            className="font-medium text-slate-400 hover:text-blue-400 cursor-pointer transition"
                        >
                            {job.company}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                    </div>
                    <span className="text-sm font-bold text-white">{job.salary}</span>
                </div>

                <button
                    onClick={() => router.push(`/apply?jobId=${job.id}`)}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 group-hover:bg-blue-600"
                >
                    Apply <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
