"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useUnreadMessages() {
    const { user } = useAuth();
    const supabase = createClient();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        // Initial Fetch
        const fetchUnread = async () => {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', user.id)
                .is('read_at', null);

            if (!error && count !== null) {
                setUnreadCount(count);
            }
        };

        fetchUnread();

        // Realtime Subscription
        const channel = supabase.channel('unread_messages')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for INSERT (new msg) and UPDATE (mark as read)
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                },
                () => {
                    // Re-fetch count on any change to unread messages for this user
                    fetchUnread();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return unreadCount;
}
