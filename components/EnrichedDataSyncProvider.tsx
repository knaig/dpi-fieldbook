'use client';

import { useEnrichedDataSync } from '@/lib/useEnrichedDataSync';
import { useActorSync } from '@/lib/useActorSync';

export function EnrichedDataSyncProvider({ children }: { children: React.ReactNode }) {
  // Auto-sync all actors from storage.json into localStorage
  useActorSync();
  // Auto-sync enriched data on app load
  useEnrichedDataSync();
  
  return <>{children}</>;
}

