"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";

interface ResumeUploaderProps {
    onUploadComplete: (url: string, fileName: string) => void;
    existingFileUrl?: string | null;
    existingFileName?: string | null;
    userId: string;
}

export default function ResumeUploader({ onUploadComplete, existingFileUrl, existingFileName, userId }: ResumeUploaderProps) {
    const [fileUrl, setFileUrl] = useState<string | null>(existingFileUrl || null);
    const [fileName, setFileName] = useState<string | null>(existingFileName || null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFile = async (uploadedFile: File) => {
        // Validate type
        if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(uploadedFile.type)) {
            alert("Please upload a PDF or Word document.");
            return;
        }

        // Validate size (e.g. 5MB)
        if (uploadedFile.size > 5 * 1024 * 1024) {
            alert("File is too large (max 5MB).");
            return;
        }

        setUploading(true);
        try {
            const fileExt = uploadedFile.name.split('.').pop();
            const storageName = `${userId}/resume-${Date.now()}.${fileExt}`;
            const { error } = await supabase.storage
                .from('resumes')
                .upload(storageName, uploadedFile);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('resumes')
                .getPublicUrl(storageName);

            setFileUrl(publicUrl);
            setFileName(uploadedFile.name);
            onUploadComplete(publicUrl, uploadedFile.name);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload resume");
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const clearFile = () => {
        setFileUrl(null);
        setFileName(null);
        onUploadComplete("", "");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (fileUrl) {
        return (
            <div className="w-full rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white truncate max-w-[200px]">{fileName || "Resume"}</p>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-300 hover:text-white hover:underline">
                            View Document
                        </a>
                    </div>
                </div>
                <button
                    onClick={clearFile}
                    className="p-2 text-slate-400 hover:text-white transition"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>
        )
    }

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={clsx(
                "relative flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 transition-all",
                isDragging
                    ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                uploading && "opacity-50 pointer-events-none"
            )}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <div className="mb-4 rounded-full bg-slate-800 p-4 shadow-xl">
                {uploading ? (
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                ) : (
                    <Upload className="h-6 w-6 text-blue-400" />
                )}
            </div>

            <p className="mb-2 text-lg font-bold text-white">
                {uploading ? "Uploading..." : "Upload Resume"}
            </p>
            <p className="mb-6 text-center text-sm text-slate-400">
                Drag & drop PDF or Docx <br />
                <span className="opacity-50">(Max 5MB)</span>
            </p>

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-700"
            >
                Select File
            </button>
        </div>
    );
}
