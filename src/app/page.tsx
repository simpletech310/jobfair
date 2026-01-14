"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Briefcase, Search, ArrowRight, UserCircle2, Building2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />
      <div className="fixed top-0 left-1/4 h-[500px] w-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
      <div className="fixed bottom-0 right-1/4 h-[500px] w-[500px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />

      {/* Header */}
      <header className="relative z-50 w-full border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Job Fair</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => router.push("/jobs")} className="text-sm font-semibold text-slate-300 hover:text-white transition">Find Jobs</button>
            <button onClick={() => router.push("/employer")} className="text-sm font-semibold text-slate-300 hover:text-white transition">Hiring?</button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl grid-cols-1 md:grid-cols-2">

        {/* Seeker Side */}
        <div className="group relative flex flex-col justify-center border-b border-white/5 md:border-b-0 md:border-r p-8 md:p-16 transition-all hover:bg-white/[0.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <div className="relative z-10 max-w-lg">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-400">
              <UserCircle2 className="h-4 w-4" />
              For Job Seekers
            </div>
            <h2 className="mb-6 text-5xl font-extrabold tracking-tight text-white md:text-6xl">
              Find Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Next Big Thing</span>
            </h2>
            <p className="mb-10 text-lg text-slate-400 leading-relaxed">
              Ditch the paper resume. Stand out with video introductions, direct connection to hiring managers, and AI-matched opportunities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/jobs")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-105 active:scale-95"
              >
                <Search className="h-5 w-5" />
                Browse Jobs
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-white/10"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>

        {/* Employer Side */}
        <div className="group relative flex flex-col justify-center p-8 md:p-16 transition-all hover:bg-white/[0.02]">
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <div className="relative z-10 max-w-lg md:ml-auto md:text-right">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-semibold text-purple-400 md:ml-auto">
              <Building2 className="h-4 w-4" />
              For Employers
            </div>
            <h2 className="mb-6 text-5xl font-extrabold tracking-tight text-white md:text-6xl">
              Hire Top <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">Global Talent</span>
            </h2>
            <p className="mb-10 text-lg text-slate-400 leading-relaxed">
              Post jobs in minutes. See the person behind the resume with video applications. efficient, human, and modern hiring.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
              <button
                onClick={() => router.push("/employer")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-950 px-8 py-4 text-lg font-bold shadow-lg shadow-white/10 transition-transform hover:scale-105 active:scale-95"
              >
                <Briefcase className="h-5 w-5" />
                Post a Job
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
