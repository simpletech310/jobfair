import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, CheckCircle, Video, Search, UserCheck } from "lucide-react";
import { clsx } from "clsx";

export const metadata = {
  title: "JobFair | Video-First Job Marketplace",
  description: "Get seen, not just sorted. JobFair connects job seekers and employers through video profiles, making hiring human again.",
};

export default function Home() {
  return (
    <div className="bg-slate-950 min-h-screen">

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

          {/* Text Content */}
          <div className="text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Video className="h-3 w-3" /> The Future of Hiring
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight mb-6">
              Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Seen</span>. <br />
              Get Hired.
            </h1>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Stop hiding behind a PDF. JobFair lets you showcase your personality, communication skills, and passion through video applications that employers actually watch.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/auth" className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 shadow-xl shadow-blue-500/20 transition flex items-center justify-center gap-2">
                I'm a Job Seeker <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/auth" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition">
                I'm an Employer
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-slate-500 text-sm font-medium">
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Free for Seekers</div>
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Verified Companies</div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative mx-auto lg:mx-0 w-full max-w-lg lg:max-w-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-purple-500/30 blur-3xl rounded-full opacity-50" />
            <Image
              src="/hero-split.png"
              alt="JobFair Mobile and Desktop Experience"
              width={800}
              height={600}
              className="relative rounded-3xl border border-white/10 shadow-2xl z-10 hover:scale-[1.02] transition duration-500"
              priority
            />
          </div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 bg-slate-900/50 border-y border-white/5 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Making Connections Human Again</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We use technology to bring people closer, not strictly to filter them out. Our platform is built for the dual needs of modern hiring.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="glass p-1 rounded-3xl border border-white/10 rotate-1 hover:rotate-0 transition duration-500">
              <Image
                src="/connection.png"
                alt="Digital Connection"
                width={600}
                height={400}
                className="rounded-[20px]"
              />
            </div>

            <div className="space-y-12">
              <div className="flex gap-6">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Video className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Video Introductions</h3>
                  <p className="text-slate-400 leading-relaxed">
                    A resume tells 10% of the story. A 30-second video pitch tells the rest. Show your energy, communication style, and cultural fit before the first interview.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <UserCheck className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Smart Matching</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Employers see candidates that actually match their vibe. Seekers get seen by companies looking for their specific soft skills.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400">
                  <Search className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Transparency</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Know where you stand. Real-time application updates and feedback loops so you're never ghosted again.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience CTA */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Seeker Card */}
            <div className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-white/5 p-10 hover:border-blue-500/50 transition duration-300">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl group-hover:bg-blue-600/30 transition" />

              <h3 className="text-2xl font-bold text-white mb-4 relative z-10">For Job Seekers</h3>
              <p className="text-slate-400 mb-8 relative z-10 min-h-[50px]">
                Ready to stand out? Create your profile, record your pitch, and apply to top companies in minutes.
              </p>
              <Link href="/auth" className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 relative z-10">
                Create Free Profile <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Employer Card */}
            <div className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-white/5 p-10 hover:border-purple-500/50 transition duration-300">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl group-hover:bg-purple-600/30 transition" />

              <h3 className="text-2xl font-bold text-white mb-4 relative z-10">For Employers</h3>
              <p className="text-slate-400 mb-8 relative z-10 min-h-[50px]">
                Tired of reading identical resumes? Watch video intros and hire based on potential and personality.
              </p>
              <Link href="/auth" className="inline-flex items-center gap-2 text-purple-400 font-bold hover:text-purple-300 relative z-10">
                Post a Job <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} JobFair. All rights reserved.</p>
      </footer>
    </div>
  );
}
