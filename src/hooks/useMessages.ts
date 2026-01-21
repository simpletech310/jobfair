import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read_at?: string;
}

export function useMessages(conversationId: string | null) {
    const { user } = useAuth();
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!conversationId || !user) {
            setMessages([]);
            return;
        }

        let isMounted = true;
        const channel = supabase.channel(`conversation:${conversationId}`);

        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error fetching messages:", error);
                if (isMounted) setError(error.message);
            } else {
                if (isMounted) setMessages(data || []);
            }
            if (isMounted) setLoading(false);
        };

        const setupRealtime = () => {
            channel
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${conversationId}`
                    },
                    (payload) => {
                        const newMsg = payload.new as Message;
                        setMessages(prev => [...prev, newMsg]);
                    }
                )
                .subscribe();
        };

        fetchMessages();
        setupRealtime();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [conversationId, user]);

    const sendMessage = async (content: string, receiverId?: string) => {
        console.log("Attempting to send message:", { conversationId, userId: user?.id, content, receiverId });
        if (!conversationId || !user || !content.trim()) {
            console.error("Missing required fields for sending message");
            return;
        }

        const payload: any = {
            conversation_id: conversationId,
            sender_id: user.id,
            content: content.trim()
        };

        if (receiverId) {
            payload.receiver_id = receiverId;
        }

        const { error } = await supabase
            .from('messages')
            .insert(payload);

        if (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message: " + error.message);
            throw error;
        } else {
            console.log("Message sent successfully");
        }
    };

    return { messages, loading, error, sendMessage };
}
