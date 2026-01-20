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
            <div className="glass p-8 rounded-3xl text-center border border-green-500/20 bg-green-50 animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Message Sent!</h3>
                <p className="text-zinc-500">
                    Thanks for your interest. Our team will reach out to <span className="text-black font-medium">{email}</span> shortly.
                </p>
                <button
                    onClick={() => { setIsSent(false); setEmail(""); setMessage(""); }}
                    className="mt-6 text-sm text-green-600 font-bold hover:text-green-700 transition"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <div className="glass p-8 rounded-3xl border border-zinc-200 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-zinc-100 blur-3xl pointer-events-none" />

            <div className="relative z-10">
                <h3 className="text-2xl font-bold text-black mb-2">
                    {title || "Interested?"}
                </h3>
                <p className="text-zinc-500 mb-6">
                    {description || "Leave your details and we'll get back to you within 24 hours."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute top-3.5 left-4 h-5 w-5 text-zinc-400" />
                        <input
                            required
                            type="email"
                            placeholder="Your Work Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 py-3 text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition"
                        />
                    </div>

                    <textarea
                        rows={3}
                        placeholder="How can we help you?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition resize-none"
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting || !email}
                        className={clsx(
                            "w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white shadow-lg transition-all active:scale-95",
                            "bg-black hover:bg-zinc-800",
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

                    <p className="text-center text-xs text-zinc-500 mt-4">
                        Or email us directly at <a href="mailto:support@jobfair.com" className="text-black hover:underline transition">support@jobfair.com</a>
                    </p>
                </form>
            </div>
        </div>
    );
}
