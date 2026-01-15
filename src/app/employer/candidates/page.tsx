"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Search, MapPin, Play, FileText, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

export default function CandidateSearch() {
    const router = useRouter();
    const supabase = createClient();

    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        const { data, error } = await supabase
            .from('seekers')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setProfiles(data);
        }
        setLoading(false);
    };

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-10 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/employer")} className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-bold text-white tracking-tight">Access Talent</h1>
                    </div>

                    <div className="relative hidden md:block w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, title, or skill..."
                            className="w-full rounded-full bg-white/5 border border-white/10 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>
                </div>
            </header>

            {/* Mobile Search */}
            <div className="md:hidden px-6 py-4 border-b border-white/5">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search candidates..."
                    className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
            </div>

            <main className="relative mx-auto max-w-6xl p-6 md:p-10">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProfiles.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-500">
                            No profiles found. Ask users to create their profile first!
                        </div>
                    ) : (
                        filteredProfiles.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedProfile(p)}
                                className="group glass p-6 rounded-3xl cursor-pointer hover:bg-white/5 transition hover:-translate-y-1"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 p-0.5">
                                        <div className="h-full w-full rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden">
                                            {p.avatar_url ? (
                                                <img src={p.avatar_url} alt={p.full_name} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-6 w-6 text-white" />
                                            )}
                                        </div>
                                    </div>
                                    {p.intro_video_url && (
                                        <div className="rounded-full bg-white/10 p-2 text-white/50 group-hover:text-blue-400 group-hover:bg-blue-500/20 transition">
                                            <Play className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{p.full_name || "Unknown"}</h3>
                                <p className="text-sm text-blue-400 font-medium mb-4">{p.title || "Job Seeker"}</p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {p.skills?.slice(0, 3).map((s: string) => (
                                        <span key={s} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                            {s}
                                        </span>
                                    ))}
                                    {p.skills?.length > 3 && <span className="text-xs text-slate-600">+{p.skills.length - 3}</span>}
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                                    <span>{p.experience_years || 0} Years Exp</span>
                                    {p.resume_stats?.url && (
                                        <span className="flex items-center gap-1">
                                            <FileText className="h-3 w-3" /> Resume
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Modal Reused */}
            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row h-[80vh]">

                        <button onClick={() => setSelectedProfile(null)} className="absolute top-4 right-4 z-50 p-2 text-white bg-black/50 rounded-full hover:bg-white/20">
                            <ArrowLeft className="h-5 w-5" />
                        </button>

                        {/* Left: Video */}
                        <div className="bg-black w-full md:w-1/2 flex items-center justify-center">
                            {selectedProfile.intro_video_url ? (
                                <video
                                    src={selectedProfile.intro_video_url}
                                    controls
                                    className="max-h-full max-w-full"
                                />
                            ) : (
                                <div className="text-slate-600 flex flex-col items-center">
                                    <Play className="h-12 w-12 mb-2 opacity-50" />
                                    <p>No Intro Video</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Info */}
                        <div className="w-full md:w-1/2 p-8 overflow-y-auto bg-slate-900 border-l border-white/5">
                            <h2 className="text-3xl font-bold text-white mb-1">{selectedProfile.full_name}</h2>
                            <p className="text-lg text-blue-400 mb-6">{selectedProfile.title}</p>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">About</h3>
                                    <p className="text-slate-300 leading-relaxed text-sm">{selectedProfile.bio}</p>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProfile.skills?.map((s: string) => (
                                            <span key={s} className="px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-300 border border-white/5">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {selectedProfile.experience_years > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Experience</h3>
                                        <p className="text-slate-300 font-bold">{selectedProfile.experience_years} Years of Experience</p>
                                    </div>
                                )}

                                {selectedProfile.resume_stats?.url && (
                                    <div className="pt-6 border-t border-white/5">
                                        <a href={selectedProfile.resume_stats.url} target="_blank" className="flex items-center gap-2 text-blue-400 text-sm font-bold hover:underline">
                                            <FileText className="h-4 w-4" /> Download Resume
                                        </a>
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
