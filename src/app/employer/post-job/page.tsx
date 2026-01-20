"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Building, Layout, List, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { clsx } from "clsx";

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
        <div className="min-h-screen bg-zinc-50 font-sans text-black pb-24 selection:bg-zinc-200">
            <div className="fixed inset-0 bg-white pointer-events-none" />

            {/* Professional Header */}
            <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-black transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="h-6 w-px bg-zinc-200" />
                        <h1 className="text-lg font-bold text-black tracking-tight">New Job Posting</h1>
                    </div>
                </div>
            </header>

            <main className="relative mx-auto max-w-6xl p-8 z-10">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                        {/* Left Column: Core Info */}
                        <div className="lg:col-span-2 space-y-8">

                            <div className="glass rounded-2xl p-8 bg-white border border-zinc-200 shadow-sm">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-black mb-6 pb-4 border-b border-zinc-100">
                                    <Layout className="h-5 w-5 text-black" />
                                    Job Details
                                </h2>

                                <div className="grid gap-6">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-500">Job Title <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Senior Frontend Engineer"
                                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition"
                                        />
                                    </div>

                                    {/* Company & Location Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-zinc-500">Company Name <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                                <input
                                                    required
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleChange}
                                                    placeholder="Acme Corp"
                                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-zinc-500">Location <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                                <input
                                                    required
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    placeholder="Remote"
                                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Salary & Type Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-zinc-500">Salary Range <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                                <input
                                                    required
                                                    name="salary"
                                                    value={formData.salary}
                                                    onChange={handleChange}
                                                    placeholder="$120k - $150k"
                                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-zinc-500">Employment Type <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                                <select
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 py-3.5 text-black focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition appearance-none"
                                                >
                                                    <option value="Full-time">Full-time</option>
                                                    <option value="Part-time">Part-time</option>
                                                    <option value="Contract">Contract</option>
                                                    <option value="Freelance">Freelance</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-500">Skills / Tags (Optional)</label>
                                        <input
                                            name="tags"
                                            value={formData.tags}
                                            onChange={handleChange}
                                            placeholder="React, Node.js, Design (Comma separated)"
                                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition"
                                        />
                                    </div>

                                </div>
                            </div>

                            <div className="glass rounded-2xl p-8 bg-white border border-zinc-200 shadow-sm">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-black mb-6 pb-4 border-b border-zinc-100">
                                    <List className="h-5 w-5 text-black" />
                                    Job Description
                                </h2>

                                <div className="space-y-6">
                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-500">Role Overview <span className="text-red-500">*</span></label>
                                        <textarea
                                            required
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={6}
                                            placeholder="Provide a comprehensive description of the role..."
                                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition resize-y"
                                        />
                                    </div>

                                    {/* Requirements */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-500">Key Requirements <span className="text-red-500">*</span></label>
                                        <textarea
                                            required
                                            name="requirements"
                                            value={formData.requirements}
                                            onChange={handleChange}
                                            rows={5}
                                            placeholder="• 5+ years experience...&#10;• Strong communication skills...&#10;(One per line)"
                                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition resize-y font-mono text-sm"
                                        />
                                    </div>

                                    {/* Responsibilities */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-500">Responsibilities (Will be added to description)</label>
                                        <textarea
                                            name="responsibilities"
                                            value={formData.responsibilities}
                                            onChange={handleChange}
                                            rows={5}
                                            placeholder="• Lead the engineering team...&#10;• Architect scalable solutions...&#10;(One per line)"
                                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition resize-y font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Sidebar / Submit */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="sticky top-24 space-y-6">
                                <div className="glass rounded-2xl p-6 border border-zinc-200 bg-white shadow-sm">
                                    <h3 className="font-bold text-black mb-4">Publishing Checklist</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-2 text-sm text-zinc-500">
                                            <CheckCircle2 className={`h-4 w-4 ${formData.title ? 'text-green-600' : 'text-zinc-300'}`} />
                                            <span>Job Title defined</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-zinc-500">
                                            <CheckCircle2 className={`h-4 w-4 ${formData.salary ? 'text-green-600' : 'text-zinc-300'}`} />
                                            <span>Salary range set</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-zinc-500">
                                            <CheckCircle2 className={`h-4 w-4 ${formData.description.length > 50 ? 'text-green-600' : 'text-zinc-300'}`} />
                                            <span>Detailed description</span>
                                        </li>
                                    </ul>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full rounded-xl bg-black py-4 font-bold text-white shadow-lg shadow-black/10 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
