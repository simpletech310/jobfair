"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Briefcase, Plus, X, Video, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
// We removed VideoRecorder component usage in favor of new VideoUploader
// import VideoRecorder from "@/components/VideoRecorder"; 
// ^ Assuming user meant to use the uploader. The previous file had VideoRecorder, 
// but we just built VideoUploader. 
// Let's use VideoUploader for MVP as it handles the "Intro Video" logic.
import VideoUploader from "@/components/VideoUploader";
import ResumeUploader from "@/components/ResumeUploader";

export default function EditProfile() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Profile State
    const [formData, setFormData] = useState({
        full_name: "",
        title: "",
        bio: "",
        skills: "",
        socialLinks: "",
    });
    // For MVP, socialLinks isn't in schema, but we can store it or ignore it.
    // Schema: full_name, title, bio, skills (array), experience_years, resume_stats(jsonb), intro_video_url

    // We need experience stored. In schema we didn't add JSONB for experience?
    // Let's check schema... "skills text[]". No experience column except "experience_years int".
    // For MVP, lets just store experience in "bio" or append to it? 
    // OR Update schema to add `experience jsonb`. 
    // UPDATE: Schema has `resume_stats jsonb`. 
    // Let's just create a quick migration or assume we add `experience jsonb` to schema if we want to save it structred.
    // For now, I'll store it in local state and if schema fails I'll warn.
    // Actually, I can allow the client to insert into a JSONB column if I define it.
    // Let's assume `experience` is part of profile JSON or we add it quickly. 
    // I'll stick to the "Basic Info" fields that match Schema for now to avoid errors.

    // Schema:
    // id, email, full_name, title, bio, skills, experience_years, resume_stats, intro_video_url

    const [experienceYears, setExperienceYears] = useState(0);

    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const [resumeName, setResumeName] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'info' | 'media'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/auth');
            } else {
                loadProfile();
            }
        }
    }, [user, authLoading]);

    const loadProfile = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('seekers')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setFormData({
                    full_name: data.full_name || "",
                    title: data.title || "",
                    bio: data.bio || "",
                    skills: data.skills ? data.skills.join(", ") : "",
                    socialLinks: "" // Not in DB yet
                });
                setExperienceYears(data.experience_years || 0);
                setVideoUrl(data.intro_video_url);

                // Parse resume stats if exists
                if (data.resume_stats) {
                    setResumeUrl(data.resume_stats.url);
                    setResumeName(data.resume_stats.name);
                }
            } else if (error && error.code !== 'PGRST116') {
                console.error("Error loading profile:", error);
            }
            // If PGRST116 (no row), we just leave user with empty form to create one.
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(Boolean);

            const updates = {
                id: user.id,
                email: user.email!,
                full_name: formData.full_name,
                title: formData.title,
                bio: formData.bio,
                skills: skillsArray,
                experience_years: experienceYears,
                intro_video_url: videoUrl,
                resume_stats: resumeUrl ? { url: resumeUrl, name: resumeName } : null
            };

            const { error } = await supabase
                .from('seekers')
                .upsert(updates);

            if (error) throw error;

            // Redirect or notify
            // For MVP, verify check then redirect
            router.push("/profile");
        } catch (err) {
            console.error(err);
            alert("Failed to save profile");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 pb-24">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-10 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-bold text-white">Edit Profile</h1>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Save"}
                    </button>
                </div>
            </header>

            <main className="relative mx-auto max-w-2xl p-6">

                {/* Tabs */}
                <div className="mb-8 flex rounded-xl bg-white/5 p-1">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${activeTab === 'info' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Basic Info
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${activeTab === 'media' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Media & Resume
                    </button>
                </div>

                {activeTab === 'info' ? (
                    <div className="space-y-6 animate-fade-in">

                        {/* Basic Fields */}
                        <div className="glass rounded-2xl p-6 space-y-4">
                            <h2 className="text-sm font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                                <User className="h-4 w-4" /> Personal Details
                            </h2>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Full Name</label>
                                <input
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Jane Doe"
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Professional Title</label>
                                <input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Senior Product Designer"
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Skills (Comma separated)</label>
                                <input
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                    placeholder="Figma, React, UX Research"
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Years of Experience</label>
                                <input
                                    type="number"
                                    value={experienceYears}
                                    onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">

                        {/* Video Intro */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-sm font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                                <Video className="h-4 w-4" /> Main Video Intro
                            </h2>
                            <p className="text-xs text-slate-400 mb-6">
                                This video will be shown on your profile to all employers. Keep it generic!
                            </p>
                            <div className="flex justify-center">
                                <div className="w-full max-w-sm">
                                    <VideoUploader
                                        onUploadComplete={setVideoUrl}
                                        currentVideoUrl={videoUrl}
                                        userId={user?.id || ""}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Resume Upload */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-sm font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Resume / CV
                            </h2>
                            <ResumeUploader
                                onUploadComplete={(url, name) => {
                                    setResumeUrl(url);
                                    setResumeName(name);
                                }}
                                existingFileUrl={resumeUrl}
                                existingFileName={resumeName}
                                userId={user?.id || ""}
                            />
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
