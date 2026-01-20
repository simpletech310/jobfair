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
    Save
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

                <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full flex-1">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-black text-white shadow-lg shadow-black/20">
                            <Building className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-black">Company Profile</h1>
                            <p className="text-zinc-500">Manage your brand presence and employer identity.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Brand Assets */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Logo */}
                            <div className="glass p-6 rounded-3xl border border-zinc-200 bg-white space-y-4">
                                <h3 className="text-lg font-bold text-black">Company Logo</h3>
                                <p className="text-sm text-zinc-500">Upload your official logo. Used on job posts and search results.</p>
                                <div className="flex justify-center py-4">
                                    <PhotoUploader
                                        userId={user!.id}
                                        existingPhotoUrl={logoUrl}
                                        onUploadComplete={setLogoUrl}
                                    />
                                </div>
                            </div>

                            {/* Video */}
                            <div className="glass p-6 rounded-3xl border border-zinc-200 bg-white space-y-4">
                                <h3 className="text-lg font-bold text-black">Culture Video</h3>
                                <p className="text-sm text-zinc-500">Showcase your office, team, or mission. Max 2 mins.</p>
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
                        <div className="glass p-8 rounded-3xl border border-zinc-200 bg-white space-y-6">
                            <h3 className="text-xl font-bold text-black border-b border-zinc-100 pb-4">Company Details</h3>

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
                </div>
            </main>
        </div>
    );
}
