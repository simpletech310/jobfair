"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Lock, Mail, User, Briefcase, ArrowRight, Loader2 } from "lucide-react";

export default function AuthPage() {
    const { login, signUp } = useAuth();
    const router = useRouter();
    const [startMode, setStartMode] = useState<'login' | 'register'>('login');
    const [role, setRole] = useState<'seeker' | 'employer'>('seeker');

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        companyName: ""
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);

        try {
            if (startMode === 'login') {
                await login(formData.email, formData.password);
                if (role === 'employer') {
                    router.push('/employer');
                } else {
                    router.push('/jobs');
                }
            } else {
                await signUp(
                    formData.email,
                    formData.password,
                    role,
                    {
                        full_name: formData.name,
                        company_name: role === 'employer' ? formData.companyName : undefined
                    }
                );
            }
        } catch (err: any) {
            setError(typeof err === 'string' ? err : "Authentication failed. Check details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                        Job<span className="text-blue-500">Fair</span>
                    </h1>
                    <p className="text-slate-400">The video-first marketplace for modern careers.</p>
                </div>

                <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                    {/* Toggle */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-full mb-8">
                        <button
                            type="button"
                            onClick={() => { setStartMode('login'); setError(""); }}
                            className={clsx("flex-1 py-2 text-sm font-bold rounded-full transition", startMode === 'login' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => { setStartMode('register'); setError(""); }}
                            className={clsx("flex-1 py-2 text-sm font-bold rounded-full transition", startMode === 'register' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                        >
                            Create Account
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {startMode === 'register' && (
                            <>
                                {/* Role Selection */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div
                                        onClick={() => setRole('seeker')}
                                        className={clsx("cursor-pointer rounded-xl border p-4 text-center transition", role === 'seeker' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 opacity-50 hover:opacity-100")}
                                    >
                                        <User className={clsx("mx-auto h-6 w-6 mb-2", role === 'seeker' ? "text-blue-400" : "text-slate-400")} />
                                        <p className={clsx("text-xs font-bold uppercase", role === 'seeker' ? "text-white" : "text-slate-500")}>Seeker</p>
                                    </div>
                                    <div
                                        onClick={() => setRole('employer')}
                                        className={clsx("cursor-pointer rounded-xl border p-4 text-center transition", role === 'employer' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 opacity-50 hover:opacity-100")}
                                    >
                                        <Briefcase className={clsx("mx-auto h-6 w-6 mb-2", role === 'employer' ? "text-blue-400" : "text-slate-400")} />
                                        <p className={clsx("text-xs font-bold uppercase", role === 'employer' ? "text-white" : "text-slate-500")}>Employer</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <User className="absolute top-3.5 left-4 h-5 w-5 text-slate-500" />
                                    <input
                                        required
                                        placeholder="Full Name"
                                        className="w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {role === 'employer' && (
                                    <div className="relative">
                                        <Briefcase className="absolute top-3.5 left-4 h-5 w-5 text-slate-500" />
                                        <input
                                            required
                                            placeholder="Company Name"
                                            className="w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                            value={formData.companyName}
                                            onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="relative">
                            <Mail className="absolute top-3.5 left-4 h-5 w-5 text-slate-500" />
                            <input
                                required
                                type="email"
                                placeholder="Email Address"
                                className="w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute top-3.5 left-4 h-5 w-5 text-slate-500" />
                            <input
                                required
                                type="password"
                                placeholder="Password"
                                className="w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                value={formData.password}
                                minLength={6}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3.5 font-bold text-white shadow-lg transition hover:shadow-blue-500/25 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                <>
                                    {startMode === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>

                    </form>
                </div>

                <p className="text-center text-xs text-slate-500 mt-8">
                    &copy; 2026 JobFair Inc. All rights reserved.
                </p>
            </div>
        </div>
    );
}
