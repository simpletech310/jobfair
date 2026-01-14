"use client";

import InterestedForm from "@/components/InterestedForm";
import Navbar from "@/components/Navbar";
import { CheckCircle, Users, Zap, Shield, TrendingUp, Search } from "lucide-react";

export default function EmployerBenefitsPage() {
    const benefits = [
        {
            icon: Zap,
            title: "Hire 3x Faster",
            description: "Skip the screening calls. See communication skills and personality instantly through 30-second video introductions."
        },
        {
            icon: Users,
            title: "Better Culture Fit",
            description: "Resumes don't show vibe. Video applications let you assess energy and soft skills before you even schedule an interview."
        },
        {
            icon: Search,
            title: "Smart Discovery",
            description: "Our algorithm surfaces candidates who match your specific needs, not just keyword stuffers."
        },
        {
            icon: Shield,
            title: "Verified Talent",
            description: "Every profile is verified to ensure you're talking to real, motivated candidates ready to work."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar />

            <main className="pt-24 pb-20 px-6">
                <div className="max-w-7xl mx-auto space-y-20">

                    {/* Hero Section */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                                For Employers
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                                Stop Hiring <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Blindly.</span>
                            </h1>
                            <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
                                The traditional hiring process is broken. JobFair brings the human element back to recruiting with video-first applications.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <div className="flex items-center gap-2 text-slate-300 font-medium">
                                    <CheckCircle className="h-5 w-5 text-green-400" /> Save 20+ hours per hire
                                </div>
                                <div className="flex items-center gap-2 text-slate-300 font-medium">
                                    <CheckCircle className="h-5 w-5 text-green-400" /> Reduce ghosting
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <InterestedForm
                                role="employer"
                                title="Transform Your Hiring"
                                description="Ready to see the difference? Get in touch with our team for a personalized demo."
                            />
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-10 border-b border-white/5">
                        <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/5">
                            <div className="text-3xl font-bold text-purple-400 mb-1">60%</div>
                            <div className="text-sm text-slate-500 font-medium">Less Time Screening</div>
                        </div>
                        <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/5">
                            <div className="text-3xl font-bold text-blue-400 mb-1">2.5x</div>
                            <div className="text-sm text-slate-500 font-medium">Higher Response Rate</div>
                        </div>
                        <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/5">
                            <div className="text-3xl font-bold text-green-400 mb-1">98%</div>
                            <div className="text-sm text-slate-500 font-medium">Candidate Satisfaction</div>
                        </div>
                        <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/5">
                            <div className="text-3xl font-bold text-pink-400 mb-1">Zero</div>
                            <div className="text-sm text-slate-500 font-medium">Listing Fees (Beta)</div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-4">Why Top Companies Switch</h2>
                            <p className="text-slate-400">Everything you need to build your dream team, faster.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="glass p-6 rounded-3xl border border-white/5 hover:border-purple-500/30 transition duration-300 group">
                                    <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition">
                                        <benefit.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
