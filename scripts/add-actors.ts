// This script needs to run in the browser context
// Open the browser console at http://localhost:3000 and paste this code

import('../app/api/importActors/route').then(({ default: handler }) => {
  fetch('/api/importActors', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      console.log('Actors ready:', data);
      // Now add each actor to localStorage
      const currentActors = JSON.parse(localStorage.getItem('dpi-fieldbook-actors') || '[]');
      const newActors = data.actors;
      
      // Merge with existing actors (avoid duplicates)
      const existingNames = new Set(currentActors.map((a: any) => a.name));
      const toAdd = newActors.filter((a: any) => !existingNames.has(a.name));
      
      const merged = [...currentActors, ...toAdd];
      localStorage.setItem('dpi-fieldbook-actors', JSON.stringify(merged));
      
      console.log(`Added ${toAdd.length} new actors. Total: ${merged.length}`);
      alert(`Added ${toAdd.length} actors! Refresh the page.`);
      window.location.reload();
    });
});

