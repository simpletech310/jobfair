"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building, Loader2, MessageSquare, Send, User } from "lucide-react";
import { clsx } from "clsx";
import { useMessages } from "@/hooks/useMessages";

import { useSearchParams } from "next/navigation";

function MessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetEmployerId = searchParams.get('employerId');

    const { user, loading: authLoading } = useAuth();
    const supabase = createClient();

    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
    const [loadingConvs, setLoadingConvs] = useState(true);

    // Messages Hook
    const { messages, sendMessage, loading: messagesLoading } = useMessages(selectedConversation?.id);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        } else if (user) {
            fetchConversations();
        }
    }, [user, authLoading]);

    const fetchConversations = async () => {
        if (!user) return;
        setLoadingConvs(true);

        // Fetch conversations with employer details
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                employers (
                    id,
                    company_name,
                    company_logo_url,
                    industry
                )
            `)
            .eq('seeker_id', user.id)
            .order('updated_at', { ascending: false });

        let currentConvs = data || [];

        if (!error) {
            setConversations(currentConvs);
        }

        // Handle Deep Linking / Auto Creation
        if (targetEmployerId) {
            const existing = currentConvs.find((c: any) => c.employer_id === targetEmployerId);
            if (existing) {
                setSelectedConversation(existing);
            } else {
                // Create New Conversation
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert({
                        seeker_id: user.id,
                        employer_id: targetEmployerId
                    })
                    .select(`
                        *,
                        employers (
                            id,
                            company_name,
                            company_logo_url,
                            industry
                        )
                    `)
                    .single();

                if (newConv) {
                    setConversations([newConv, ...currentConvs]);
                    setSelectedConversation(newConv);
                } else {
                    console.error("Failed to create conversation:", createError);
                }
            }
        } else if (currentConvs.length > 0 && !selectedConversation) {
            // Optional: Auto select most recent if no param? 
            // Better to show list on mobile, select first on desktop?
            // leaving explicit selection for now.
        }

        setLoadingConvs(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        await sendMessage(newMessage);
        setNewMessage("");
    };

    // Mark as read when opening conversation
    useEffect(() => {
        if (selectedConversation && user) {
            markAsRead(selectedConversation.id);
            scrollToBottom();
        }
    }, [selectedConversation, messages]);

    const markAsRead = async (conversationId: string) => {
        await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('receiver_id', user?.id)
            .is('read_at', null);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    if (authLoading || loadingConvs) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-zinc-50 pt-20 pb-10 px-4 md:px-0">
            <div className="max-w-6xl mx-auto h-[80vh] bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex">

                {/* Sidebar List */}
                <div className={clsx(
                    "w-full md:w-1/3 border-r border-zinc-200 flex flex-col bg-zinc-50/50",
                    selectedConversation ? "hidden md:flex" : "flex"
                )}>
                    <div className="p-4 border-b border-zinc-200">
                        <h1 className="text-xl font-bold text-black mb-1">Messages</h1>
                        <p className="text-xs text-zinc-500">Your conversations with employers</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-zinc-400">
                                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>No active conversations.</p>
                                <button onClick={() => router.push('/jobs')} className="mt-2 text-sm text-black font-bold hover:underline">Find Jobs</button>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={clsx(
                                        "w-full text-left p-4 border-b border-zinc-100 hover:bg-white transition flex items-center gap-3",
                                        selectedConversation?.id === conv.id ? "bg-white border-l-4 border-l-black shadow-sm" : "border-l-4 border-l-transparent"
                                    )}
                                >
                                    <div className="h-10 w-10 rounded-lg bg-zinc-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {conv.employers?.company_logo_url ? (
                                            <img src={conv.employers.company_logo_url} alt="Logo" className="h-full w-full object-cover" />
                                        ) : (
                                            <Building className="h-5 w-5 text-zinc-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-black truncate">{conv.employers?.company_name || "Employer"}</h3>
                                        <p className="text-xs text-zinc-500 truncate">
                                            {new Date(conv.updated_at || conv.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={clsx(
                    "flex-1 flex flex-col bg-white",
                    !selectedConversation ? "hidden md:flex" : "flex"
                )}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-zinc-100 flex items-center gap-3 bg-white">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-black"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden">
                                    {selectedConversation.employers?.company_logo_url ? (
                                        <img src={selectedConversation.employers.company_logo_url} className="h-full w-full object-cover" />
                                    ) : (
                                        <Building className="h-4 w-4 text-zinc-400" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-bold text-black">{selectedConversation.employers?.company_name || "Employer"}</h2>
                                    <p className="text-xs text-zinc-500">{selectedConversation.employers?.industry || "Company"}</p>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30">
                                {messages.map((msg: any) => (
                                    <div key={msg.id} className={clsx("flex flex-col max-w-[80%]", msg.sender_id === user?.id ? "ml-auto items-end" : "items-start")}>
                                        <div className={clsx("rounded-2xl px-4 py-2 text-sm", msg.sender_id === user?.id ? "bg-black text-white" : "bg-white border border-zinc-200 text-black shadow-sm")}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-zinc-400 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-100 flex gap-2">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2 text-sm text-black focus:border-black focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-2 rounded-full bg-black text-white hover:bg-zinc-800 disabled:opacity-50 transition"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                            <MessageSquare className="h-16 w-16 mb-4 opacity-10" />
                            <p>Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default function SeekerMessagesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <MessagesContent />
        </Suspense>
    );
}
