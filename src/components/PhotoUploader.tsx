"use client";

import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Trash2, Loader2, User } from "lucide-react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";

interface PhotoUploaderProps {
    onUploadComplete: (url: string) => void;
    existingPhotoUrl?: string | null;
    userId: string;
}

export default function PhotoUploader({ onUploadComplete, existingPhotoUrl, userId }: PhotoUploaderProps) {
    const [photoUrl, setPhotoUrl] = useState<string | null>(existingPhotoUrl || null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFile = async (uploadedFile: File) => {
        // Validate type
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(uploadedFile.type)) {
            alert("Please upload a JPG, PNG, or WebP image.");
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
            const storageName = `${userId}/avatar-${Date.now()}.${fileExt}`;

            // Using 'avatars' bucket - ensure it exists in Supabase
            const { error } = await supabase.storage
                .from('avatars')
                .upload(storageName, uploadedFile);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(storageName);

            setPhotoUrl(publicUrl);
            onUploadComplete(publicUrl);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload photo");
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
        setPhotoUrl(null);
        onUploadComplete("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (photoUrl) {
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                    <img
                        src={photoUrl}
                        alt="Profile"
                        className="h-32 w-32 rounded-full object-cover border-4 border-slate-800 shadow-xl"
                    />
                    <button
                        onClick={clearFile}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
                <p className="text-xs text-slate-400 font-medium">Click delete to change</p>
            </div>
        )
    }

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={clsx(
                "relative flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 border-dashed transition-all cursor-pointer overflow-hidden",
                isDragging
                    ? "border-blue-500 bg-blue-500/10 scale-105"
                    : "border-slate-700 bg-slate-800/50 hover:border-white/30 hover:bg-slate-800",
                uploading && "opacity-50 pointer-events-none"
            )}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {uploading ? (
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                    <User className="h-8 w-8" />
                    <span className="text-[10px] font-bold uppercase">Upload</span>
                </div>
            )}
        </div>
    );
}
