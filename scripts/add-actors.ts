// This script is meant to be pasted into the browser console at
// http://localhost:3000 while the app is running.
// It calls the import API and merges actors into localStorage.

(async () => {
  try {
    const res = await fetch('/api/importActors', { method: 'POST' });
    const data = await res.json();
    console.log('Actors ready:', data);

    const currentActors = JSON.parse(localStorage.getItem('dpi-fieldbook-actors') || '[]');
    const newActors = data.actors || [];

    const existingNames = new Set(currentActors.map((a: any) => a.name));
    const toAdd = newActors.filter((a: any) => !existingNames.has(a.name));

    const merged = [...currentActors, ...toAdd];
    localStorage.setItem('dpi-fieldbook-actors', JSON.stringify(merged));

    console.log(`Added ${toAdd.length} new actors. Total: ${merged.length}`);
    alert(`Added ${toAdd.length} actors! Refresh the page.`);
    window.location.reload();
  } catch (e) {
    console.error('Failed to add actors:', e);
  }
})();

