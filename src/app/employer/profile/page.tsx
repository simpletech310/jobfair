"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Search as SearchIcon,
    MessageSquare,
    Building,
    LogOut,
    Menu,
    User,
    Loader2,
    Save,
    Edit,
    Eye,
    Globe,
    MapPin
} from "lucide-react";
import { clsx } from "clsx";
import PhotoUploader from "@/components/PhotoUploader";
import VideoUploader from "@/components/VideoUploader";

export default function EmployerProfile() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Form State
    const [companyName, setCompanyName] = useState("");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [mission, setMission] = useState("");
    const [culture, setCulture] = useState("");
    const [website, setWebsite] = useState("");

    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [previewJobs, setPreviewJobs] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'employer') {
                router.push('/auth');
            } else {
                fetchProfile();
            }
        }
    }, [user, authLoading]);

    const fetchProfile = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('employers')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            setCompanyName(data.company_name || "");
            setLogoUrl(data.company_logo_url || null);
            setVideoUrl(data.company_video_url || null);
            setMission(data.mission || "");
            setCulture(data.culture_description || "");
            setWebsite(data.website || "");
        }

        // Fetch jobs for preview
        const { data: jobsData } = await supabase
            .from('jobs')
            .select('*')
            .eq('employer_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (jobsData) setPreviewJobs(jobsData);

        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        if (!companyName.trim()) {
            alert("Company Name is required");
            setSaving(false);
            return;
        }

        const { error } = await supabase
            .from('employers')
            .upsert({
                id: user.id,
                email: user.email!,
                company_name: companyName,
                company_logo_url: logoUrl,
                company_video_url: videoUrl,
                mission,
                culture_description: culture,
                website,
            });

        if (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile.");
        } else {
            alert("Profile saved successfully!");
        }
        setSaving(false);
    };

    if (authLoading || loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-black" /></div>;

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'jobs', label: 'My Jobs', icon: Briefcase },
        { id: 'candidates', label: 'Applications', icon: Users },
        { id: 'search', label: 'Find Candidates', icon: SearchIcon },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-200 flex text-black">
            <div className="fixed inset-0 bg-white pointer-events-none z-0" />

            {/* --- SIDEBAR --- */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transform transition-transform duration-300 md:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="h-16 flex items-center px-6 border-b border-zinc-100">
                        <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center font-bold text-white shadow-md mr-3">J</div>
                        <span className="text-lg font-bold text-black tracking-tight">JobFair</span>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => router.push('/employer')}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-500 hover:text-black hover:bg-zinc-100 transition-all duration-200"
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </button>
                        ))}
                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-black text-white shadow-lg shadow-black/10 transition-all duration-200"
                        >
                            <Building className="h-5 w-5" />
                            Company Profile
                        </button>
                    </nav>

                    <div className="p-4 border-t border-zinc-100">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 mb-2">
                            <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center">
                                <User className="h-4 w-4 text-zinc-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-black truncate">{user?.email}</p>
                                <p className="text-xs text-zinc-500">Employer</p>
                            </div>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-zinc-500 hover:text-red-500 transition"
                        >
                            <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {isSidebarOpen && (
                <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" />
            )}

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-64 relative z-10 flex flex-col min-h-screen">

                {/* Mobile Header */}
                <header className="md:hidden h-16 flex items-center justify-between px-4 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500">
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="text-lg font-bold text-black">Company Profile</span>
                    <div className="w-10" />
                </header>

                <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full flex-1">

                    {/* Header & Toggle */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-black">Company Profile</h1>
                            <p className="text-zinc-500">Manage how you appear to job seekers.</p>
                        </div>
                        <div className="flex p-1 rounded-xl bg-zinc-100 border border-zinc-200">
                            <button
                                onClick={() => setMode('edit')}
                                className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition", mode === 'edit' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black")}
                            >
                                <Edit className="h-4 w-4" /> Edit
                            </button>
                            <button
                                onClick={() => setMode('preview')}
                                className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition", mode === 'preview' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black")}
                            >
                                <Eye className="h-4 w-4" /> Preview
                            </button>
                        </div>
                    </div>

                    {mode === 'edit' ? (
                        <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
                            {/* Brand Assets */}
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Logo */}
                                <div className="p-6 rounded-3xl border border-zinc-200 bg-white space-y-4 shadow-sm">
                                    <h3 className="text-lg font-bold text-black">Company Logo</h3>
                                    <p className="text-sm text-zinc-500">Upload your official logo.</p>
                                    <div className="flex justify-center py-4">
                                        <PhotoUploader
                                            userId={user!.id}
                                            existingPhotoUrl={logoUrl}
                                            onUploadComplete={setLogoUrl}
                                        />
                                    </div>
                                </div>

                                {/* Video */}
                                <div className="p-6 rounded-3xl border border-zinc-200 bg-white space-y-4 shadow-sm">
                                    <h3 className="text-lg font-bold text-black">Culture Video</h3>
                                    <p className="text-sm text-zinc-500">Showcase your office or mission.</p>
                                    <div className="flex justify-center py-4">
                                        <VideoUploader
                                            userId={user!.id}
                                            currentVideoUrl={videoUrl}
                                            onUploadComplete={setVideoUrl}
                                            maxDuration={120}
                                            label="Company Video"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Company Details */}
                            <div className="p-8 rounded-3xl border border-zinc-200 bg-white space-y-6 shadow-sm">
                                <h3 className="text-xl font-bold text-black border-b border-zinc-100 pb-4">Details</h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-700">Company Name *</label>
                                        <input
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:border-black transition"
                                            placeholder="Acme Corp"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-700">Website</label>
                                        <input
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:border-black transition"
                                            placeholder="https://acme.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700">Our Mission</label>
                                    <textarea
                                        value={mission}
                                        onChange={(e) => setMission(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:border-black transition min-h-[100px]"
                                        placeholder="What drives your company?"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700">Culture & Values</label>
                                    <textarea
                                        value={culture}
                                        onChange={(e) => setCulture(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:border-black transition min-h-[100px]"
                                        placeholder="Describe your work environment..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-black hover:bg-zinc-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />}
                                    Save Profile
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-200 animate-fade-in">
                            {/* Preview matches /companies/[id] layout structure but inlined */}
                            <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
                                <div className="p-8 md:p-12">
                                    <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                                        <div className="h-32 w-32 rounded-3xl bg-white p-2 border border-zinc-200 shadow-xl overflow-hidden shrink-0">
                                            {logoUrl ? (
                                                <img src={logoUrl} alt={companyName} className="h-full w-full object-contain" />
                                            ) : (
                                                <div className="h-full w-full bg-black flex items-center justify-center text-4xl font-bold text-white">
                                                    {companyName[0] || "C"}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h1 className="text-4xl font-extrabold text-black tracking-tight mb-2">{companyName || "Your Company"}</h1>
                                            {website && (
                                                <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-zinc-600 hover:text-black font-medium bg-zinc-100 px-4 py-1.5 rounded-full transition pointer-events-none">
                                                    <Globe className="h-4 w-4" /> {website.replace(/^https?:\/\//, '')}
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-8 md:grid-cols-3">
                                        <div className="md:col-span-2 space-y-8">
                                            {videoUrl && (
                                                <div className="rounded-3xl overflow-hidden border border-zinc-200 shadow-xl aspect-video bg-black">
                                                    <video src={videoUrl} controls className="w-full h-full" />
                                                </div>
                                            )}

                                            <div className="space-y-6">
                                                {mission && (
                                                    <div>
                                                        <h3 className="text-sm font-bold uppercase text-zinc-400 mb-3">Our Mission</h3>
                                                        <p className="text-lg text-black leading-relaxed font-light">"{mission}"</p>
                                                    </div>
                                                )}

                                                {culture && (
                                                    <div className="pt-6 border-t border-zinc-100">
                                                        <h3 className="text-sm font-bold uppercase text-zinc-400 mb-3">Culture & Values</h3>
                                                        <p className="text-zinc-600 leading-relaxed whitespace-pre-line">{culture}</p>
                                                    </div>
                                                )}
                                                {!mission && !culture && (
                                                    <p className="text-zinc-400 italic">No additional information provided.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
                                                <h3 className="text-black font-bold mb-6 flex items-center gap-2">
                                                    <Briefcase className="h-5 w-5 text-black" />
                                                    Active Openings
                                                </h3>

                                                {previewJobs.length === 0 ? (
                                                    <p className="text-zinc-400 text-sm">No active jobs.</p>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {previewJobs.map(job => (
                                                            <div key={job.id} className="block bg-white p-4 rounded-xl border border-zinc-200 opacity-75">
                                                                <h4 className="font-bold text-black text-sm">{job.title}</h4>
                                                                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                                                                    <MapPin className="h-3 w-3" /> {job.location}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
