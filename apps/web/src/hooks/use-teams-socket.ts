'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';

const EVENTS = [
  'member_joined',
  'member_removed',
  'invite_sent',
  'team_updated',
  'team_archived',
  'status_changed',
] as const;

export function useTeamsSocket(teamId: string | null) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:3010';
    const socket: Socket = io(`${gatewayUrl}/events`, { withCredentials: true, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (teamId) {
        socket.emit('team:subscribe', { teamId });
      }
    });

    for (const event of EVENTS) {
      socket.on(event, async () => {
        await queryClient.invalidateQueries({ queryKey: ['teams'] });
      });
    }

    return () => {
      for (const event of EVENTS) {
        socket.off(event);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [teamId, queryClient]);
}
