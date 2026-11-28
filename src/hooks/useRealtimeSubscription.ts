/**
 * Leak-free Supabase Realtime subscription hook for NurseGo
 */

import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface RealtimeTableSpec {
  table: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
}

export function useRealtimeSubscription(
  channelName: string,
  tables: RealtimeTableSpec[],
  onDataChange: () => void,
  enabled: boolean = true
) {
  const callbackRef = useRef(onDataChange);
  callbackRef.current = onDataChange;

  const tablesKey = JSON.stringify(tables);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured() || tables.length === 0) {
      return;
    }

    const supabase = getSupabase();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const channel: RealtimeChannel = supabase.channel(`${channelName}-${Math.random().toString(36).slice(2, 8)}`);

    const triggerRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        callbackRef.current();
      }, 250);
    };

    const parsedTables: RealtimeTableSpec[] = JSON.parse(tablesKey);
    parsedTables.forEach((spec) => {
      const config: any = {
        event: spec.event || '*',
        schema: 'public',
        table: spec.table,
      };
      if (spec.filter) {
        config.filter = spec.filter;
      }
      channel.on('postgres_changes', config, triggerRefresh);
    });

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.warn(`Realtime channel status on ${channelName}: ${status}`);
      }
    });

    // Realtime is the fast path. Polling is a safety net for environments where
    // Postgres changes are not enabled for a table/publication or mobile clients
    // temporarily lose their channel while backgrounded.
    const fallbackRefresh = setInterval(() => {
      if (document.visibilityState === 'visible') triggerRefresh();
    }, 15000);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(fallbackRefresh);
      supabase.removeChannel(channel);
    };
  }, [channelName, tablesKey, enabled]);
}
