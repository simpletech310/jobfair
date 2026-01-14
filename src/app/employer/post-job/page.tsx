"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Building, Layout, List, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

export default function PostJob() {
    const router = useRouter();
    const { user } = useAuth();
    const supabase = createClient();

    const [formData, setFormData] = useState({
        title: "",
        company: "",
        location: "Remote",
        salary: "",
        type: "Full-time",
        tags: "",
        description: "",
        requirements: "",
        responsibilities: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return; // Should be handled by middleware/auth check
        setIsSubmitting(true);

        try {
            // 1. Ensure Employer Profile exists (upsert)
            // Ideally we do this on signup, but for MVP flexibility we do it here.
            const { error: profileError } = await supabase
                .from('employers')
                .upsert({
                    id: user.id,
                    email: user.email!,
                    company_name: formData.company,
                    // We don't have other fields in form (mission, website). 
                    // Use defaults or leave null if schema allows.
                }, { onConflict: 'id' }); // Only update if needed, but company name change here updates profile.

            if (profileError) throw profileError;

            // 2. Insert Job
            const fullDescription = formData.description + (formData.responsibilities ? "\n\nResponsibilities:\n" + formData.responsibilities : "");

            const { error: jobError } = await supabase
                .from('jobs')
                .insert({
                    employer_id: user.id,
                    title: formData.title,
                    description: fullDescription,
                    location: formData.location,
                    salary_range: formData.salary,
                    job_type: formData.type,
                    requirements: formData.requirements.split("\n").filter(Boolean),
                });

            if (jobError) throw jobError;

            router.push("/employer");
        } catch (error) {
            console.error("Failed to create job", error);
            alert("Failed to create job. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-24 selection:bg-blue-500/30">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

            {/* Professional Header */}
            <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="h-6 w-px bg-white/10" />
                        <h1 className="text-lg font-bold text-white tracking-tight">New Job Posting</h1>
                    </div>
                </div>
            </header>

            <main className="relative mx-auto max-w-6xl p-8 z-10">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                        {/* Left Column: Core Info */}
                        <div className="lg:col-span-2 space-y-8">

                            <div className="glass rounded-2xl p-8">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-6 pb-4 border-b border-white/5">
                                    <Layout className="h-5 w-5 text-blue-400" />
                                    Job Details
                                </h2>

                                <div className="grid gap-6">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Job Title <span className="text-red-400">*</span></label>
                                        <input
                                            required
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Senior Frontend Engineer"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </div>

                                    {/* Company & Location Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">Company Name <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                                <input
                                                    required
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleChange}
                                                    placeholder="Acme Corp"
                                                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">Location <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                                <input
                                                    required
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    placeholder="Remote"
                                                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Salary & Type Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">Salary Range <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                                <input
                                                    required
                                                    name="salary"
                                                    value={formData.salary}
                                                    onChange={handleChange}
                                                    placeholder="$120k - $150k"
                                                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">Employment Type <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                                <select
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition appearance-none"
                                                >
                                                    <option value="Full-time" className="bg-slate-900">Full-time</option>
                                                    <option value="Part-time" className="bg-slate-900">Part-time</option>
                                                    <option value="Contract" className="bg-slate-900">Contract</option>
                                                    <option value="Freelance" className="bg-slate-900">Freelance</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tags (Saved in memory/metadata or ignored if schema doesn't support) */}
                                    {/* Schema doesn't have tags column. We will ignore for MVP or append to description */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Skills / Tags (Optional)</label>
                                        <input
                                            name="tags"
                                            value={formData.tags}
                                            onChange={handleChange}
                                            placeholder="React, Node.js, Design (Comma separated)"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                                        />
                                    </div>

                                </div>
                            </div>

                            <div className="glass rounded-2xl p-8">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-6 pb-4 border-b border-white/5">
                                    <List className="h-5 w-5 text-blue-400" />
                                    Job Description
                                </h2>

                                <div className="space-y-6">
                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Role Overview <span className="text-red-400">*</span></label>
                                        <textarea
                                            required
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={6}
                                            placeholder="Provide a comprehensive description of the role..."
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition resize-y"
                                        />
                                    </div>

                                    {/* Requirements */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Key Requirements <span className="text-red-400">*</span></label>
                                        <textarea
                                            required
                                            name="requirements"
                                            value={formData.requirements}
                                            onChange={handleChange}
                                            rows={5}
                                            placeholder="• 5+ years experience...&#10;• Strong communication skills...&#10;(One per line)"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition resize-y font-mono text-sm"
                                        />
                                    </div>

                                    {/* Responsibilities (Appended to description on submit effectively? No, schema has description. We can leave it here for UI completeness but inform user) */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Responsibilities (Will be added to description)</label>
                                        <textarea
                                            name="responsibilities"
                                            value={formData.responsibilities}
                                            onChange={handleChange}
                                            rows={5}
                                            placeholder="• Lead the engineering team...&#10;• Architect scalable solutions...&#10;(One per line)"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition resize-y font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Sidebar / Submit */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="sticky top-24 space-y-6">
                                <div className="glass rounded-2xl p-6 border border-white/5">
                                    <h3 className="font-bold text-white mb-4">Publishing Checklist</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-2 text-sm text-slate-400">
                                            <CheckCircle2 className={`h-4 w-4 ${formData.title ? 'text-green-400' : 'text-slate-600'}`} />
                                            <span>Job Title defined</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-slate-400">
                                            <CheckCircle2 className={`h-4 w-4 ${formData.salary ? 'text-green-400' : 'text-slate-600'}`} />
                                            <span>Salary range set</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-slate-400">
                                            <CheckCircle2 className={`h-4 w-4 ${formData.description.length > 50 ? 'text-green-400' : 'text-slate-600'}`} />
                                            <span>Detailed description</span>
                                        </li>
                                    </ul>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Publishing..." : "Publish Job Post"}
                                </button>
                            </div>
                        </div>

                    </div>
                </form>
            </main>
        </div>
    );
}
