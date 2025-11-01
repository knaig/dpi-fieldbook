'use client';

import { useEffect, useState } from 'react';
import { useFieldbookStore } from './useFieldbookStore';

export function useEnrichedDataSync() {
  const { actors, mergeActorIntelligence, isHydrated } = useFieldbookStore();
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (!isHydrated || hasSynced || actors.length === 0) return;

    const syncEnrichedData = async () => {
      try {
        console.log('[SYNC] Loading enriched data...');
        const response = await fetch('/api/loadEnrichedData');
        const data = await response.json();

        if (data.success && data.enrichedActors) {
          let syncedCount = 0;
          
          // For each actor in localStorage, check if we have enriched data
          actors.forEach(actor => {
            const enrichedData = data.enrichedActors[actor.name];
            if (enrichedData && enrichedData.lastEnriched) {
              // Merge enriched data into the actor
              mergeActorIntelligence(actor.id, enrichedData);
              syncedCount++;
            }
          });

          console.log(`[SYNC] Synced ${syncedCount}/${actors.length} actors with enriched data`);
        }
      } catch (error) {
        console.error('[SYNC] Error syncing enriched data:', error);
      } finally {
        setHasSynced(true);
      }
    };

    syncEnrichedData();
  }, [isHydrated, actors, hasSynced, mergeActorIntelligence]);

  return { hasSynced };
}

