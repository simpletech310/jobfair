"use client";

import InterestedForm from "@/components/InterestedForm";
import Navbar from "@/components/Navbar";
import { Video, Star, Smartphone, ArrowRight, UserCheck } from "lucide-react";
import Image from "next/image";

export default function SeekerBenefitsPage() {
    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            <Navbar />

            <main className="pt-20">
                {/* Mobile-First Hero */}
                <div className="px-6 mb-12 text-center md:text-left md:flex md:items-center md:gap-12 md:max-w-5xl md:mx-auto">
                    <div className="md:flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                            For Job Seekers
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
                            More Than a <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Piece of Paper.</span>
                        </h1>
                        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                            Resumes are boring. You aren't. Show employers your true personality with video profiles that get you hired.
                        </p>
                    </div>
                    <div className="relative mx-auto w-64 h-64 md:w-80 md:h-80 md:mx-0">
                        <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full animate-pulse" />
                        <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition duration-500 bg-slate-900 flex items-center justify-center">
                            <Video className="h-20 w-20 text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* Vertical Value Props for Mobile Scroll */}
                <div className="space-y-4 px-4 max-w-md mx-auto md:max-w-5xl md:grid md:grid-cols-3 md:gap-6 md:space-y-0 md:px-6">

                    <div className="glass p-6 rounded-3xl flex items-center gap-4 md:block md:text-center">
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex flex-shrink-0 items-center justify-center text-blue-400 md:mx-auto md:mb-4">
                            <Video className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Record Your Pitch</h3>
                            <p className="text-sm text-slate-400 md:mt-2">30 seconds to tell your story.</p>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl flex items-center gap-4 md:block md:text-center">
                        <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex flex-shrink-0 items-center justify-center text-purple-400 md:mx-auto md:mb-4">
                            <Star className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Stand Out</h3>
                            <p className="text-sm text-slate-400 md:mt-2">Beat the resume stack algorithm.</p>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl flex items-center gap-4 md:block md:text-center">
                        <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex flex-shrink-0 items-center justify-center text-green-400 md:mx-auto md:mb-4">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Apply on Mobile</h3>
                            <p className="text-sm text-slate-400 md:mt-2">Job hunting from anywhere.</p>
                        </div>
                    </div>

                </div>

                {/* One Big CTA / Form */}
                <div className="mt-20 px-4 max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-white mb-2">Ready to get seen?</h2>
                        <p className="text-slate-400">Join the waitlist for early access to premium features.</p>
                    </div>
                    <InterestedForm
                        role="seeker"
                        title="Join the Talent V2"
                        description="Be the first to know when new video jobs drop."
                    />
                </div>

            </main>
        </div>
    );
}
