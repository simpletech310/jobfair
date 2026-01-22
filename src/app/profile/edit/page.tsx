"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Briefcase, Plus, X, Video, FileText, Loader2, Trash2, AlertTriangle, Linkedin, Github, Facebook, Instagram, Globe, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
// We removed VideoRecorder component usage in favor of new VideoUploader
// import VideoRecorder from "@/components/VideoRecorder"; 
// ^ Assuming user meant to use the uploader. The previous file had VideoRecorder, 
// but we just built VideoUploader. 
// Let's use VideoUploader for MVP as it handles the "Intro Video" logic.
import VideoUploader from "@/components/VideoUploader";
import ResumeUploader from "@/components/ResumeUploader";
import PhotoUploader from "@/components/PhotoUploader";

export default function EditProfile() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Profile State
    const [formData, setFormData] = useState({
        full_name: "",
        title: "",
        bio: "",
        skills: "",
        socialLinks: {
            linkedin: "",
            github: "",
            website: "",
            instagram: ""
        },
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
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'info' | 'media'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Toggle State
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');

    const handleDeleteAccount = async () => {
        if (confirmText !== "DELETE") return;

        setIsDeleting(true);
        try {
            const { error } = await supabase.rpc('delete_account');
            if (error) throw error;

            await logout();
            router.push('/');
        } catch (error) {
            console.error("Error deleting account:", error);
            alert("Failed to delete account. Please try again.");
            setIsDeleting(false);
        }
    };

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
                    socialLinks: data.social_links || { linkedin: "", github: "", website: "", instagram: "" }
                });
                setExperienceYears(data.experience_years || 0);
                setVideoUrl(data.intro_video_url);
                setPhotoUrl(data.avatar_url);

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
                avatar_url: photoUrl,
                social_links: formData.socialLinks,
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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-black animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-200 pb-24">
            <div className="fixed inset-0 bg-white pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-10 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-black transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>

                        {/* Toggle */}
                        <div className="flex p-1 rounded-lg bg-zinc-100 border border-zinc-200">
                            <button
                                onClick={() => setMode('edit')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 ${mode === 'edit' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'}`}
                            >
                                <Briefcase className="h-3 w-3" /> Edit
                            </button>
                            <button
                                onClick={() => setMode('preview')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 ${mode === 'preview' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'}`}
                            >
                                <User className="h-3 w-3" /> Preview
                            </button>
                        </div>
                    </div>

                    {mode === 'edit' && (
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="rounded-full bg-black px-6 py-2 text-sm font-bold text-white shadow-lg hover:bg-zinc-800 disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </button>
                    )}
                </div>
            </header>

            <main className="relative mx-auto max-w-2xl p-6">

                {/* Tabs - Only show in Edit Mode */}
                {mode === 'edit' && (
                    <div className="mb-8 flex rounded-xl bg-white p-1 border border-zinc-200">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${activeTab === 'info' ? 'bg-zinc-100 text-black shadow' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            Basic Info
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${activeTab === 'media' ? 'bg-zinc-100 text-black shadow' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            Media & Resume
                        </button>
                    </div>
                )}

                {activeTab === 'info' ? (
                    <div className="space-y-6 animate-fade-in">

                        {/* Basic Fields */}
                        <div className="glass rounded-2xl p-6 space-y-4 border border-zinc-200 bg-white">
                            <div className="flex justify-center mb-6">
                                <PhotoUploader
                                    userId={user?.id || ""}
                                    existingPhotoUrl={photoUrl}
                                    onUploadComplete={setPhotoUrl}
                                />
                            </div>

                            <h2 className="text-sm font-bold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                                <User className="h-4 w-4" /> Personal Details
                            </h2>

                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">Full Name</label>
                                <input
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Jane Doe"
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-black focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">Professional Title</label>
                                <input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Senior Product Designer"
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-black focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-black focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">Skills (Comma separated)</label>
                                <input
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                    placeholder="Figma, React, UX Research"
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-black focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">Years of Experience</label>
                                <input
                                    type="number"
                                    value={experienceYears}
                                    onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-black focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="glass rounded-2xl p-6 space-y-4 border border-zinc-200 bg-white">
                            <h2 className="text-sm font-bold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                                <Globe className="h-4 w-4" /> Social Profile
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500 flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn</label>
                                    <input
                                        value={formData.socialLinks.linkedin}
                                        onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })}
                                        placeholder="Profile URL"
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-black focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500 flex items-center gap-1"><Github className="h-3 w-3" /> GitHub</label>
                                    <input
                                        value={formData.socialLinks.github}
                                        onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, github: e.target.value } })}
                                        placeholder="Profile URL"
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-black focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500 flex items-center gap-1"><Globe className="h-3 w-3" /> Portfolio / Website</label>
                                    <input
                                        value={formData.socialLinks.website}
                                        onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, website: e.target.value } })}
                                        placeholder="https://..."
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-black focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500 flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</label>
                                    <input
                                        value={formData.socialLinks.instagram}
                                        onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                                        placeholder="Profile URL"
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-black focus:outline-none focus:border-black"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Delete Account Section */}
                        <div className="glass rounded-2xl p-6 border border-zinc-200 bg-white space-y-4">
                            <h2 className="text-sm font-bold uppercase text-red-500 mb-4 flex items-center gap-2">
                                <Trash2 className="h-4 w-4" /> Danger Zone
                            </h2>
                            <p className="text-xs text-zinc-500">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition flex items-center justify-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" /> Delete Account
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">

                        {/* Video Intro */}
                        <div className="glass rounded-2xl p-6 border border-zinc-200 bg-white">
                            <h2 className="text-sm font-bold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                                <Video className="h-4 w-4" /> Main Video Intro
                            </h2>
                            <p className="text-xs text-zinc-500 mb-6">
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
                        <div className="glass rounded-2xl p-6 border border-zinc-200 bg-white">
                            <h2 className="text-sm font-bold uppercase text-zinc-400 mb-4 flex items-center gap-2">
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

                {/* Preview Mode */}
                {mode === 'preview' && (
                    <div className="animate-fade-in space-y-8">
                        {/* Profile Card */}
                        <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm text-center">
                            <div className="h-32 w-32 rounded-full bg-zinc-100 mx-auto mb-6 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                                {photoUrl ? (
                                    <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 text-zinc-300" />
                                )}
                            </div>
                            <h1 className="text-3xl font-extrabold text-black tracking-tight mb-2">{formData.full_name || "Your Name"}</h1>
                            <p className="text-lg text-zinc-500 font-medium mb-4">{formData.title || "Your Title"}</p>

                            <div className="flex justify-center gap-3 mb-6">
                                {formData.socialLinks.linkedin && (
                                    <a href={formData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-[#0077b5] hover:text-white transition">
                                        <Linkedin className="h-4 w-4" />
                                    </a>
                                )}
                                {formData.socialLinks.github && (
                                    <a href={formData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-black hover:text-white transition">
                                        <Github className="h-4 w-4" />
                                    </a>
                                )}
                                {formData.socialLinks.website && (
                                    <a href={formData.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-800 hover:text-white transition">
                                        <Globe className="h-4 w-4" />
                                    </a>
                                )}
                                {formData.socialLinks.instagram && (
                                    <a href={formData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-[#E1306C] hover:text-white transition">
                                        <Instagram className="h-4 w-4" />
                                    </a>
                                )}
                            </div>

                            <div className="flex justify-center gap-2 mb-6">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-xs font-bold">
                                    <Briefcase className="h-3 w-3" /> {experienceYears} Years Exp
                                </span>
                            </div>

                            {/* Skills */}
                            {formData.skills && (
                                <div className="flex flex-wrap justify-center gap-2">
                                    {formData.skills.split(",").map((skill, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold border border-zinc-200">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Video & Bio Grid */}
                        <div className="grid gap-6">
                            {/* Video */}
                            {videoUrl && (
                                <div className="bg-black rounded-3xl overflow-hidden shadow-xl border border-zinc-800 aspect-video relative group">
                                    <video src={videoUrl} controls className="w-full h-full object-cover" />
                                </div>
                            )}

                            {/* Bio */}
                            <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
                                <h3 className="text-sm font-bold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                                    <User className="h-4 w-4" /> About Me
                                </h3>
                                <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                                    {formData.bio || "No bio provided yet."}
                                </p>
                            </div>

                            {/* Resume */}
                            <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-black font-bold text-sm">Resume / CV</h3>
                                        <p className="text-xs text-zinc-500">{resumeName || "No resume uploaded"}</p>
                                    </div>
                                </div>
                                {resumeUrl && (
                                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-zinc-800 transition shadow-lg flex items-center gap-2">
                                        <Eye className="h-3 w-3" /> View Resume
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-black">Delete Account?</h3>
                            <p className="text-sm text-zinc-500">
                                This action is permanent and cannot be undone. All your applications and data will be permanently removed.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-zinc-500">Type "DELETE" to confirm</label>
                                <input
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-red-500 focus:outline-none text-black font-mono placeholder:text-zinc-300 uppercase"
                                    placeholder="DELETE"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setShowDeleteModal(false); setConfirmText(""); }}
                                    className="w-full py-3 rounded-xl bg-zinc-100 text-black font-bold hover:bg-zinc-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={confirmText !== "DELETE" || isDeleting}
                                    className="w-full py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                                >
                                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isDeleting ? "Deleting..." : "Delete Forever"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
