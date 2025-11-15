import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PresenceState {
  [key: string]: {
    user_id: string;
    online_at: string;
  }[];
}

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [presenceChannel, setPresenceChannel] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state: PresenceState = channel.presenceState();
        const online = new Set<string>();
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            online.add(presence.user_id);
          });
        });
        
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          newPresences.forEach((presence: any) => {
            updated.add(presence.user_id);
          });
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          leftPresences.forEach((presence: any) => {
            updated.delete(presence.user_id);
          });
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    setPresenceChannel(channel);

    return () => {
      if (presenceChannel) {
        presenceChannel.unsubscribe();
      }
    };
  }, [user]);

  return { onlineUsers, isOnline: (userId: string) => onlineUsers.has(userId) };
};
