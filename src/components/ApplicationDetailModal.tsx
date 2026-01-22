import { X, User, XCircle, CheckCircle, FileText, Send, Linkedin, Github, Globe, Instagram } from "lucide-react";
import { clsx } from "clsx";

export default function ApplicationDetailModal({ app, onClose, onStatusUpdate, messages, newMessage, onSendMessage, setNewMessage, activeTab, setActiveTab, messagesEndRef, user }: any) {
    const seekerProfile = app.seekers;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-2xl flex flex-col md:flex-row">
                <button onClick={onClose} className="absolute top-4 right-4 z-50 rounded-full bg-white p-2 text-black hover:bg-zinc-100 shadow-md transition"><X className="h-5 w-5" /></button>

                {/* Left: Media */}
                <div className="w-full md:w-5/12 bg-zinc-100 flex items-center justify-center relative">
                    {app.video_url || seekerProfile?.intro_video_url ? (
                        <video src={app.video_url || seekerProfile?.intro_video_url} controls autoPlay className="max-h-full max-w-full" />
                    ) : (
                        <div className="text-center p-10"><User className="h-16 w-16 text-zinc-300 mx-auto mb-4" /><p className="text-zinc-400">No Video Provided</p></div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-7/12 flex flex-col bg-white border-l border-zinc-200">
                    <div className="p-6 border-b border-zinc-100">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-2xl font-bold text-black">{seekerProfile?.full_name || "Applicant"}</h2>
                                <p className="text-zinc-500 font-medium">{app.jobs?.title || "Role"}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onStatusUpdate('rejected')} className={clsx("p-2 rounded-full border transition", app.status === 'rejected' ? "bg-red-500 text-white border-red-500" : "border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50")} title="Reject"><XCircle className="h-5 w-5" /></button>
                                <button onClick={() => onStatusUpdate('interviewing')} className={clsx("p-2 rounded-full border transition", (app.status === 'interviewing' || app.status === 'accepted') ? "bg-green-500 text-white border-green-500" : "border-zinc-200 text-zinc-400 hover:text-green-600 hover:bg-green-50")} title="Shortlist"><CheckCircle className="h-5 w-5" /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6 px-6 border-b border-zinc-100">
                        {['profile', 'resume', 'messages'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={clsx("py-4 text-sm font-bold border-b-2 transition capitalize", activeTab === tab ? "border-black text-black" : "border-transparent text-zinc-400 hover:text-zinc-600")}>{tab}</button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-fade-in">
                                <div><h4 className="text-xs font-bold uppercase text-zinc-400 mb-2">Bio</h4><p className="text-zinc-600 text-sm leading-relaxed">{seekerProfile?.bio || "No bio available."}</p></div>
                                <div><h4 className="text-xs font-bold uppercase text-zinc-400 mb-2">Skills</h4><div className="flex flex-wrap gap-2">{seekerProfile?.skills?.map((s: string) => <span key={s} className="px-2 py-1 bg-white rounded text-xs text-zinc-600 border border-zinc-200">{s}</span>)}</div></div>
                                <div><h4 className="text-xs font-bold uppercase text-zinc-400 mb-2">Experience</h4><p className="text-black font-bold">{seekerProfile?.experience_years || 0} Years</p></div>

                                {seekerProfile?.social_links && (
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-zinc-400 mb-3">On the Web</h4>
                                        <div className="flex gap-2">
                                            {seekerProfile.social_links.linkedin && (
                                                <a href={seekerProfile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-[#0077b5] hover:text-white transition" title="LinkedIn"><Linkedin className="h-4 w-4" /></a>
                                            )}
                                            {seekerProfile.social_links.github && (
                                                <a href={seekerProfile.social_links.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-black hover:text-white transition" title="GitHub"><Github className="h-4 w-4" /></a>
                                            )}
                                            {seekerProfile.social_links.website && (
                                                <a href={seekerProfile.social_links.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-800 hover:text-white transition" title="Portfolio"><Globe className="h-4 w-4" /></a>
                                            )}
                                            {seekerProfile.social_links.instagram && (
                                                <a href={seekerProfile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-[#E1306C] hover:text-white transition" title="Instagram"><Instagram className="h-4 w-4" /></a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'resume' && (
                            <div className="h-full animate-fade-in flex flex-col items-center justify-center">
                                {app.resume_url || seekerProfile?.resume_stats?.url ? (
                                    <div className="text-center">
                                        <FileText className="h-16 w-16 text-black mx-auto mb-4" />
                                        <a href={app.resume_url || seekerProfile?.resume_stats?.url} target="_blank" rel="noopener" className="px-6 py-2 bg-black rounded-full text-white text-sm font-bold hover:bg-zinc-800 transition shadow-lg">View / Download PDF</a>
                                    </div>
                                ) : <p className="text-zinc-400">No Resume Uploaded</p>}
                            </div>
                        )}
                        {activeTab === 'messages' && (
                            <div className="h-full flex flex-col animate-fade-in">
                                <div className="flex-1 space-y-4 mb-4 pr-2">
                                    {messages.map((msg: any) => (
                                        <div key={msg.id} className={clsx("flex flex-col max-w-[80%]", msg.sender_id === user?.id ? "ml-auto items-end" : "items-start")}>
                                            <div className={clsx("rounded-2xl px-4 py-2 text-sm", msg.sender_id === user?.id ? "bg-black text-white" : "bg-white border border-zinc-200 text-black shadow-sm")}>{msg.content}</div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={onSendMessage} className="relative mt-auto">
                                    <div className="relative"><input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-white border border-zinc-200 rounded-full py-3 pl-4 pr-12 text-sm text-black focus:border-black focus:outline-none" /><button type="submit" disabled={!newMessage.trim()} className="absolute right-1 top-1 p-2 rounded-full bg-black text-white hover:bg-zinc-800 disabled:opacity-0 transition"><Send className="h-4 w-4" /></button></div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
