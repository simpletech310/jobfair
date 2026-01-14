"use client";

import { useState, useRef, useEffect } from "react";
import { Video, Mic, Square, RotateCcw, Play, CheckCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number; // seconds
}

export default function VideoRecorder({
  onRecordingComplete,
  maxDuration = 90,
}: VideoRecorderProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function startCamera() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(userStream);
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
        setError(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  const startRecording = () => {
    if (!stream) return;
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/mp4" });
      setRecordedBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
      onRecordingComplete(blob);
      setIsRecording(false);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setTimeLeft(maxDuration);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retake = () => {
    setRecordedBlob(null);
    setVideoUrl(null);
    setIsRecording(false);
    setTimeLeft(maxDuration);
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Video Preview */}
      <div className="relative aspect-[9/16] w-full max-w-xs overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="h-full w-full object-cover"
            playsInline
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cn(
              "h-full w-full object-cover mirror-mode scale-x-[-1]"
            )}
          />
        )}

        {/* Timer Overlay */}
        {isRecording && (
          <div className="absolute top-4 right-4 rounded-full bg-red-600/90 px-3 py-1 text-sm font-bold text-white backdrop-blur-md animate-pulse shadow-lg">
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        {videoUrl ? (
          <button
            onClick={retake}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-white/10 hover:scale-105 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Retake
          </button>
        ) : (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "group relative flex h-20 w-20 items-center justify-center rounded-full transition-all focus:outline-none",
              isRecording
                ? "bg-transparent ring-4 ring-red-500"
                : "bg-red-500 hover:bg-red-600 hover:scale-110 shadow-lg shadow-red-500/40"
            )}
          >
            {isRecording ? (
              <Square className="h-8 w-8 fill-red-500 text-red-500" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-white/20 opacity-0 transition group-hover:opacity-100" />
            )}

            {!isRecording && (
              <div className="h-3 w-3 rounded bg-white"></div>
            )}
          </button>
        )}
      </div>

      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
        {isRecording ? "Recording..." : videoUrl ? "Preview Mode" : "Tap to Record"}
      </p>
    </div>
  );
}
