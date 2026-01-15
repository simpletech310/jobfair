"use client";

import { useState, useRef } from "react";
import { Upload, FileVideo, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface VideoUploaderProps {
    onUploadComplete: (url: string) => void;
    currentVideoUrl?: string | null;
    userId: string;
    maxDuration?: number; // seconds
    label?: string;
}

export default function VideoUploader({
    onUploadComplete,
    currentVideoUrl,
    userId,
    maxDuration = 30,
    label = "Intro Video"
}: VideoUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentVideoUrl || null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFile = async (selectedFile: File) => {
        setError(null);

        // 1. Validate Type
        if (!["video/mp4", "video/quicktime"].includes(selectedFile.type)) {
            setError("Invalid file type. Please upload MP4 or MOV.");
            return;
        }

        // 2. Validate Size (e.g. 100MB limit)
        if (selectedFile.size > 100 * 1024 * 1024) {
            setError("File too large. Please keep under 100MB.");
            return;
        }

        // 3. Validate Duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = async () => {
            window.URL.revokeObjectURL(video.src);
            if (video.duration > maxDuration + 1) { // buffer of 1s
                setError(`Video must be ${maxDuration} seconds or less.`);
                return;
            }

            // Proceed to upload
            await uploadFile(selectedFile);
        };
        video.src = URL.createObjectURL(selectedFile);
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/intro-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('videos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('videos')
                .getPublicUrl(filePath);

            setPreviewUrl(publicUrl);
            onUploadComplete(publicUrl);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const clearFile = () => {
        setPreviewUrl(null);
        setError(null);
        onUploadComplete(""); // Clear in parent
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="w-full max-w-xs">
            {!previewUrl ? (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => !uploading && inputRef.current?.click()}
                    className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all cursor-pointer ${isDragging
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/50"
                        } ${error ? "border-red-500/50 bg-red-500/10" : ""} ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="video/mp4,video/quicktime"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                            if (e.target.files?.[0]) handleFile(e.target.files[0]);
                        }}
                    />

                    {uploading ? (
                        <div className="mb-4 rounded-full bg-slate-800 p-4">
                            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                        </div>
                    ) : (
                        <div className="mb-4 rounded-full bg-slate-800 p-4 transition-transform group-hover:scale-110">
                            <Upload className="h-6 w-6 text-slate-400 group-hover:text-blue-400" />
                        </div>
                    )}

                    <p className="mb-1 text-sm font-bold text-slate-200">
                        {uploading ? "Uploading..." : "Click to upload"}
                    </p>
                    <p className="text-xs text-slate-500">
                        {maxDuration}s Max (MP4/MOV)
                    </p>

                    {error && (
                        <div className="absolute -bottom-14 left-0 right-0 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 py-2 text-red-400 border border-red-500/20">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs font-medium">{error}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-xl">
                    <button
                        onClick={clearFile}
                        className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-md transition hover:bg-red-500/80"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <video
                        src={previewUrl}
                        controls
                        className="aspect-[9/16] w-full object-cover"
                    />

                    <div className="absolute bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-sm p-4 border-t border-white/5 pointer-events-none">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-500/20 p-2">
                                <FileVideo className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium text-white">{label}</p>
                                <p className="text-xs text-green-400">Ready to submit</p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

