"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle, Mail } from "lucide-react";
import { clsx } from "clsx";

interface InterestedFormProps {
    role: "employer" | "seeker";
    title?: string;
    description?: string;
}

export default function InterestedForm({ role, title, description }: InterestedFormProps) {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // For now, since we don't have a backend endpoint, we just show success.
        // In a real app, we'd POST to /api/interest
        console.log(`Interest received from ${role}:`, { email, message });

        setIsSubmitting(false);
        setIsSent(true);
    };

    if (isSent) {
        return (
            <div className="glass p-8 rounded-3xl text-center border border-green-500/20 bg-green-500/5 animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-slate-400">
                    Thanks for your interest. Our team will reach out to <span className="text-white font-medium">{email}</span> shortly.
                </p>
                <button
                    onClick={() => { setIsSent(false); setEmail(""); setMessage(""); }}
                    className="mt-6 text-sm text-green-400 font-bold hover:text-green-300 transition"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-2">
                    {title || "Interested?"}
                </h3>
                <p className="text-slate-400 mb-6">
                    {description || "Leave your details and we'll get back to you within 24 hours."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute top-3.5 left-4 h-5 w-5 text-slate-500" />
                        <input
                            required
                            type="email"
                            placeholder="Your Work Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                        />
                    </div>

                    <textarea
                        rows={3}
                        placeholder="How can we help you?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 p-4 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition resize-none"
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting || !email}
                        className={clsx(
                            "w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white shadow-lg transition-all active:scale-95",
                            role === 'employer'
                                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-purple-500/25"
                                : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-blue-500/25",
                            (isSubmitting || !email) ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Contact Support <Send className="h-4 w-4" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-500 mt-4">
                        Or email us directly at <a href="mailto:support@jobfair.com" className="text-slate-400 hover:text-white transition underline">support@jobfair.com</a>
                    </p>
                </form>
            </div>
        </div>
    );
}
