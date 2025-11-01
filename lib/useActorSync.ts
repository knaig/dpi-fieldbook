'use client';

import { useEffect, useState } from 'react';
import { useFieldbookStore } from './useFieldbookStore';

/**
 * Hook to sync all actors from storage.json into localStorage
 * This ensures the app has access to all 1,158+ actors from the database
 */
export function useActorSync() {
  const { actors, addActor, updateActor, isHydrated } = useFieldbookStore();
  const [hasSynced, setHasSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isHydrated || hasSynced || isSyncing) return;

    const syncAllActors = async () => {
      setIsSyncing(true);
      try {
        console.log('[SYNC] Loading all actors from storage.json...');
        const response = await fetch('/api/syncAllActors', { method: 'POST' });
        const data = await response.json();

        if (data.success && data.actors) {
          const validActors = data.actors;
          
          // Get current actors from localStorage directly to avoid closure issues
          const stored = localStorage.getItem('dpi-fieldbook-actors');
          const currentActors = stored ? JSON.parse(stored) : [];
          const existingIds = new Set(currentActors.map((a: any) => a.id));
          
          console.log(`[SYNC] Found ${validActors.length} valid actors in storage.json`);
          console.log(`[SYNC] Current actors in localStorage: ${currentActors.length}`);

          let addedCount = 0;
          let skippedCount = 0;
          let updatedCount = 0;

          validActors.forEach((actor: any) => {
            if (!existingIds.has(actor.id)) {
              // New actor - add it
              addActor(actor);
              addedCount++;
            } else {
              // Existing actor - check if name needs updating
              const existing = currentActors.find((a: any) => a.id === actor.id);
              if (existing) {
                const needsNameUpdate = !existing.name || 
                                       existing.name.trim() === '' || 
                                       existing.name.startsWith('Actor ') ||
                                       (existing.summitCompany && existing.name === existing.summitCompany && actor.firstName);
                
                if (needsNameUpdate && actor.name && !actor.name.startsWith('Actor ')) {
                  // Update the existing actor's name using updateActor
                  updateActor(actor.id, { name: actor.name });
                  updatedCount++;
                } else {
                  skippedCount++;
                }
              } else {
                skippedCount++;
              }
            }
          });

          console.log(`[SYNC] Added ${addedCount} new actors, updated ${updatedCount} existing actors, skipped ${skippedCount} unchanged`);
          
          // Only reload once on initial sync if we added new actors or updated names
          // Use sessionStorage to track if we've already reloaded this session
          if ((addedCount > 0 || updatedCount > 0) && !sessionStorage.getItem('sync-reloaded')) {
            console.log('[SYNC] New actors added, refreshing page once...');
            sessionStorage.setItem('sync-reloaded', 'true');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            return; // Early return to prevent marking as synced
          } else {
            console.log(`[SYNC] Sync complete - ${validActors.length} valid actors available`);
          }
        }
      } catch (error) {
        console.error('[SYNC] Error syncing actors:', error);
      } finally {
        setIsSyncing(false);
        setHasSynced(true);
      }
    };

    syncAllActors();
    // Removed 'actors' from dependencies to prevent infinite loops when actors are added
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, hasSynced, isSyncing, addActor, updateActor]);

  return { hasSynced, isSyncing };
}

