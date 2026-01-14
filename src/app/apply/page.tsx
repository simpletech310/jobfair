"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import VideoUploader from "@/components/VideoUploader";
import ResumeUploader from "@/components/ResumeUploader";
import VideoRecorder from "@/components/VideoRecorder";
import { CheckCircle, Briefcase, Sparkles, Video, User, ArrowLeft, Eye, EyeOff, FileText, ChevronDown, Loader2, MapPin, Mic, Upload } from "lucide-react";
import { clsx } from "clsx";

interface StorageFile {
    name: string;
    id: string;
    url: string;
}

function ApplicationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get("jobId");
    const { user, loading: authLoading } = useAuth();
    const supabase = createClient();

    const [activeVideoTab, setActiveVideoTab] = useState<"record" | "upload">("upload");

    // Form Data
    const [seekerName, setSeekerName] = useState("");
    const [visibility, setVisibility] = useState<"public" | "anonymous">("public");

    // Resume State
    const [activeResumeTab, setActiveResumeTab] = useState<"select" | "upload">("select");
    const [userResumes, setUserResumes] = useState<StorageFile[]>([]);
    const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);
    const [uploadedResumeUrl, setUploadedResumeUrl] = useState<string | null>(null);
    const [isFetchingResumes, setIsFetchingResumes] = useState(false);

    // Video State
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedId, setSubmittedId] = useState<string | null>(null);

    // Job Data
    const [job, setJob] = useState<any>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth?redirect=/apply?jobId=' + jobId);
            return;
        }

        if (jobId) {
            fetchJob();
        }

        if (user) {
            fetchProfile();
            fetchUserResumes();
        }
    }, [jobId, user, authLoading]);

    const fetchJob = async () => {
        const { data, error } = await supabase
            .from('jobs')
            .select(`*, employers(company_name)`)
            .eq('id', jobId)
            .single();

        if (data) {
            const employer = Array.isArray(data.employers) ? data.employers[0] : data.employers;
            setJob({
                ...data,
                company: employer?.company_name || 'Unknown Company'
            });
        }
    };

    const fetchProfile = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('seekers')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            setSeekerName(data.full_name || "");
        }
    };

    const fetchUserResumes = async () => {
        if (!user) return;
        setIsFetchingResumes(true);
        try {
            const { data, error } = await supabase
                .storage
                .from('resumes')
                .list(`${user.id}`, {
                    limit: 10,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' },
                });

            if (data) {
                const files = data.map(file => {
                    const { data: { publicUrl } } = supabase.storage
                        .from('resumes')
                        .getPublicUrl(`${user.id}/${file.name}`);
                    return {
                        name: file.name,
                        id: file.id,
                        url: publicUrl
                    };
                });
                setUserResumes(files);
                if (files.length > 0) {
                    setSelectedResumeUrl(files[0].url);
                } else {
                    setActiveResumeTab("upload");
                }
            }
        } catch (err) {
            console.error("Error fetching resumes:", err);
        } finally {
            setIsFetchingResumes(false);
        }
    };

    const handleRecordingComplete = async (blob: Blob) => {
        if (!user) return;
        setIsUploadingVideo(true);
        try {
            // Determine extension from blob type or default to mp4 (though content might be webm)
            // Ideally we check blob.type
            const fileExt = blob.type.split('/')[1] || "mp4";
            const fileName = `${user.id}/recording-${Date.now()}.${fileExt}`;

            const file = new File([blob], fileName, { type: blob.type });

            const { error: uploadError } = await supabase.storage
                .from('videos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('videos')
                .getPublicUrl(fileName);

            setVideoUrl(publicUrl);
        } catch (error) {
            console.error("Recording upload failed:", error);
            alert("Failed to upload recording.");
        } finally {
            setIsUploadingVideo(false);
        }
    };

    const handleSubmit = async () => {
        if (!user || !jobId || !seekerName) return;

        const finalResumeUrl = activeResumeTab === 'select' ? selectedResumeUrl : uploadedResumeUrl;

        if (!finalResumeUrl && !videoUrl) {
            alert("Please provide either a resume or video.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('applications')
                .insert({
                    job_id: jobId,
                    seeker_id: user.id,
                    resume_url: finalResumeUrl,
                    video_url: videoUrl,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    alert("You have already applied for this job.");
                } else {
                    throw error;
                }
                return;
            }

            setSubmittedId(data.id);
        } catch (error: any) {
            console.error(error);
            alert("Failed to submit application: " + (error.message || "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submittedId) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <div className="glass w-full max-w-md rounded-3xl p-10 animate-fade-in">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <CheckCircle className="h-10 w-10 text-green-400" />
                    </div>
                    <h2 className="mb-2 text-3xl font-bold text-white tracking-tight">Application Sent!</h2>
                    <p className="mb-8 text-slate-400 leading-relaxed">
                        Thanks, <strong className="text-white">{seekerName}</strong>. Your application for <strong>{job?.title}</strong> has been received. Good luck!
                    </p>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => router.push("/jobs")}
                            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 font-bold text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.02]"
                        >
                            Browse More Jobs
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-4 font-semibold text-slate-300 transition hover:bg-white/10"
                        >
                            Back Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!job || authLoading) {
        return <div className="pt-32 text-center text-slate-500 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <main className="mx-auto max-w-4xl px-4 pt-24 pb-24 space-y-8 relative z-10">

            <button
                onClick={() => router.push("/jobs")}
                className="absolute top-6 left-4 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-white transition"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Jobs
            </button>

            {/* JOB DESCRIPTION CARD */}
            <div className="glass rounded-3xl p-8 md:p-12 animate-slide-up">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-white/5 pb-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-300">
                            {job.job_type || 'Full-time'}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{job.title}</h1>
                        <div className="flex items-center gap-4 text-slate-400">
                            <span className="font-bold text-white flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-blue-400" /> {job.company}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" /> {job.location}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{job.salary_range}</div>
                    </div>
                </div>

                <div className="space-y-6">
                    <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-line">
                        {job.description}
                    </p>
                </div>
            </div>


            {/* APPLICATION FORM */}
            <h2 className="text-2xl font-bold text-white pt-8">Submit Your Application</h2>

            <div className="glass rounded-2xl p-1.5">
                <div className="relative flex items-center bg-transparent">
                    <User className="absolute left-4 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        value={seekerName}
                        onChange={(e) => setSeekerName(e.target.value)}
                        placeholder="Your Full Name"
                        className="w-full bg-transparent py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none focus:placeholder-slate-400"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

                {/* RESUME SECTION */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Resume / CV</h3>

                    {/* Resume Tabs */}
                    <div className="glass flex p-1.5 rounded-2xl mb-2">
                        <button
                            onClick={() => setActiveResumeTab("select")}
                            className={clsx("flex-1 py-2 text-xs font-bold rounded-xl transition", activeResumeTab === "select" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
                        >
                            From Profile
                        </button>
                        <button
                            onClick={() => setActiveResumeTab("upload")}
                            className={clsx("flex-1 py-2 text-xs font-bold rounded-xl transition", activeResumeTab === "upload" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
                        >
                            Upload New
                        </button>
                    </div>

                    <div className="glass relative overflow-hidden rounded-3xl p-6 min-h-[300px] flex flex-col">
                        {activeResumeTab === 'select' ? (
                            isFetchingResumes ? (
                                <div className="flex flex-1 items-center justify-center">
                                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                                </div>
                            ) : userResumes.length > 0 ? (
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Select a Resume</label>
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                        {userResumes.map((file) => (
                                            <button
                                                key={file.id}
                                                onClick={() => setSelectedResumeUrl(file.url)}
                                                className={clsx(
                                                    "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition",
                                                    selectedResumeUrl === file.url
                                                        ? "bg-blue-500/20 border-blue-500 text-white"
                                                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                                                )}
                                            >
                                                <div className={clsx("p-2 rounded-lg", selectedResumeUrl === file.url ? "bg-blue-500 text-white" : "bg-white/10 text-slate-500")}>
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 truncate">
                                                    <p className="text-sm font-bold truncate">{file.name}</p>
                                                    <p className="text-xs opacity-70">Saved in Profile</p>
                                                </div>
                                                {selectedResumeUrl === file.url && <CheckCircle className="h-5 w-5 text-blue-400" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-1 flex-col items-center justify-center text-center p-4">
                                    <FileText className="h-10 w-10 text-slate-600 mb-2" />
                                    <p className="text-slate-400 font-medium">No resumes found.</p>
                                    <button
                                        onClick={() => setActiveResumeTab("upload")}
                                        className="mt-4 text-sm text-blue-400 hover:underline"
                                    >
                                        Upload one now
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="flex-1 flex flex-col justify-center">
                                <ResumeUploader
                                    onUploadComplete={(url, name) => {
                                        setUploadedResumeUrl(url);
                                    }}
                                    existingFileUrl={uploadedResumeUrl}
                                    userId={user?.id || 'guest'}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* VIDEO SECTION */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Video Introduction <span className="text-slate-600 text-xs normal-case ml-2">(Optional)</span></h3>

                    {/* Video Tabs */}
                    <div className="glass flex p-1.5 rounded-2xl mb-2">
                        <button
                            onClick={() => setActiveVideoTab("upload")}
                            className={clsx("flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2", activeVideoTab === "upload" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
                        >
                            <Upload className="h-3 w-3" /> Upload
                        </button>
                        <button
                            onClick={() => setActiveVideoTab("record")}
                            className={clsx("flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2", activeVideoTab === "record" ? "bg-red-500 text-white" : "text-slate-400 hover:text-white")}
                        >
                            <Mic className="h-3 w-3" /> Record
                        </button>
                    </div>

                    <div className="glass relative overflow-hidden rounded-3xl p-4 min-h-[300px] flex flex-col items-center justify-center">
                        {isUploadingVideo ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                                <p className="text-sm text-slate-400">Processing video...</p>
                            </div>
                        ) : (
                            <div className="w-full">
                                {activeVideoTab === 'upload' ? (
                                    <VideoUploader
                                        onUploadComplete={setVideoUrl}
                                        currentVideoUrl={videoUrl}
                                        userId={user?.id || 'guest'}
                                    />
                                ) : (
                                    <VideoRecorder
                                        onRecordingComplete={handleRecordingComplete}
                                    />
                                )}
                            </div>
                        )}

                        {/* Show success indicator if video is set but we are in recording tab and it's not showing preview there explicitly yet, or just generic confirmation */}
                        {videoUrl && activeVideoTab === 'record' && (
                            <div className="mt-4 flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-bold">Video Attached</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Privacy Toggle (Mock for MVP) */}
            <div className="flex gap-2 pt-4">
                <button
                    onClick={() => setVisibility("public")}
                    className={clsx(
                        "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                        visibility === "public"
                            ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                    )}
                >
                    <div className={clsx("p-2 rounded-full", visibility === "public" ? "bg-blue-500 text-white" : "bg-white/10")}>
                        <Eye className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold">Public Profile</span>
                </button>
                <button
                    onClick={() => setVisibility("anonymous")}
                    className={clsx(
                        "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                        visibility === "anonymous"
                            ? "bg-purple-500/10 border-purple-500/50 text-purple-400"
                            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                    )}
                >
                    <div className={clsx("p-2 rounded-full", visibility === "anonymous" ? "bg-purple-500 text-white" : "bg-white/10")}>
                        <EyeOff className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold">Anonymous</span>
                </button>
            </div>


            {/* Submit Button */}
            <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-slate-900 to-slate-900/0 p-6 backdrop-blur-[2px] z-50">
                <button
                    onClick={handleSubmit}
                    disabled={!seekerName || (!videoUrl && !selectedResumeUrl && !uploadedResumeUrl) || isSubmitting || isUploadingVideo}
                    className={clsx(
                        "mx-auto w-full max-w-md block rounded-2xl py-4 text-lg font-bold text-white shadow-2xl transition-all active:scale-95",
                        !seekerName || (!videoUrl && !selectedResumeUrl && !uploadedResumeUrl) || isSubmitting || isUploadingVideo
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                            : "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-blue-500/25 hover:shadow-cyan-500/40"
                    )}
                >
                    {isSubmitting ? "Sending..." : "Submit Application"}
                </button>
            </div>
        </main>
    );
}

export default function ApplyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen pb-24 font-sans selection:bg-cyan-500/30">
            {/* Decorative Blobs */}
            <div className="fixed -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px] animate-blob" />
            <div className="fixed top-1/2 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-[100px] animate-blob delay-2000" />

            {/* Header */}
            <div className="fixed top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    <div
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">Job Fair</span>
                    </div>

                    <button
                        onClick={() => router.push("/profile")}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                        <User className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <Suspense fallback={<div className="text-white text-center pt-32">Loading Application...</div>}>
                <ApplicationContent />
            </Suspense>
        </div>
    );
}
