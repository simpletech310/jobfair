"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Building, Save } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import VideoUploader from "@/components/VideoUploader";

export default function EmployerProfile() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
        // Required fields
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
                // updated_at: new Date().toISOString() // if column exists
            });

        if (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile.");
        } else {
            alert("Profile saved successfully!");
            router.push('/employer');
        }
        setSaving(false);
    };

    if (authLoading || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

            <div className="relative max-w-4xl mx-auto p-6 lg:p-10">
                <button
                    onClick={() => router.push('/employer')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-8"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20 text-white">
                        <Building className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Company Profile</h1>
                        <p className="text-slate-400">Manage your brand presence and employer identity.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">

                    {/* Brand Assets */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Logo */}
                        <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                            <h3 className="text-lg font-bold text-white">Company Logo</h3>
                            <p className="text-sm text-slate-400">Upload your official logo. Used on job posts and search results.</p>
                            <div className="flex justify-center py-4">
                                <PhotoUploader
                                    userId={user!.id}
                                    existingPhotoUrl={logoUrl}
                                    onUploadComplete={setLogoUrl}
                                />
                            </div>
                        </div>

                        {/* Video */}
                        <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                            <h3 className="text-lg font-bold text-white">Culture Video</h3>
                            <p className="text-sm text-slate-400">Showcase your office, team, or mission. Max 2 mins.</p>
                            <div className="flex justify-center py-4">
                                <VideoUploader
                                    userId={user!.id}
                                    currentVideoUrl={videoUrl}
                                    onUploadComplete={setVideoUrl}
                                    maxDuration={120} // 2 mins
                                    label="Company Video"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Company Details */}
                    <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                        <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4">Company Details</h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">Company Name *</label>
                                <input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                    placeholder="Acme Corp"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">Website</label>
                                <input
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                    placeholder="https://acme.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300">Our Mission</label>
                            <textarea
                                value={mission}
                                onChange={(e) => setMission(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition min-h-[100px]"
                                placeholder="What drives your company?"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300">Culture & Values</label>
                            <textarea
                                value={culture}
                                onChange={(e) => setCulture(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition min-h-[100px]"
                                placeholder="Describe your work environment..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />}
                            Save Profile
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
