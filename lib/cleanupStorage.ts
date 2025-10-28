/**
 * Cleanup script to remove duplicate actors from localStorage
 */

export function cleanupDuplicateActors() {
  if (typeof window === 'undefined') return;
  
  const storageKey = 'dpi-fieldbook-actors';
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) return;
  
  try {
    const actors = JSON.parse(stored);
    
    // Remove duplicates by keeping only the first occurrence of each ID
    const seen = new Set<string>();
    const uniqueActors = actors.filter((actor: any) => {
      if (seen.has(actor.id)) {
        console.log(`Removing duplicate actor: ${actor.name} (ID: ${actor.id})`);
        return false;
      }
      seen.add(actor.id);
      return true;
    });
    
    if (uniqueActors.length !== actors.length) {
      console.log(`Removed ${actors.length - uniqueActors.length} duplicate actors`);
      localStorage.setItem(storageKey, JSON.stringify(uniqueActors));
      console.log(`Storage cleaned: ${actors.length} → ${uniqueActors.length} actors`);
      return uniqueActors.length;
    }
    
    return 0;
  } catch (e) {
    console.error('Failed to cleanup storage:', e);
    return 0;
  }
}

