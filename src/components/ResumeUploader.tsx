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

        // Validate size (100MB)
        if (uploadedFile.size > 100 * 1024 * 1024) {
            alert("File is too large (max 100MB).");
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
            <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-zinc-200 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-black" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-black truncate max-w-[200px]">{fileName || "Resume"}</p>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-black hover:underline">
                            View Document
                        </a>
                    </div>
                </div>
                <button
                    onClick={clearFile}
                    className="p-2 text-zinc-400 hover:text-red-500 transition"
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
                    ? "border-black bg-zinc-50 scale-[1.02]"
                    : "border-zinc-300 bg-white hover:border-black hover:bg-zinc-50",
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

            <div className="mb-4 rounded-full bg-zinc-100 p-4 shadow-sm">
                {uploading ? (
                    <Loader2 className="h-6 w-6 text-black animate-spin" />
                ) : (
                    <Upload className="h-6 w-6 text-black" />
                )}
            </div>

            <p className="mb-2 text-lg font-bold text-black">
                {uploading ? "Uploading..." : "Upload Resume"}
            </p>
            <p className="mb-6 text-center text-sm text-zinc-500">
                Drag & drop PDF or Docx <br />
                <span className="opacity-50">(Max 100MB)</span>
            </p>

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl bg-black px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-zinc-800"
            >
                Select File
            </button>
        </div>
    );
}
