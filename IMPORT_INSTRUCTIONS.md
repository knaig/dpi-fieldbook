# Import Actors - Browser Console Method

Since localStorage is browser-only, run this in your browser console at http://localhost:3000:

```javascript
fetch('/api/importActors', { method: 'POST' })
  .then(res => res.json())
  .then(data => {
    const currentActors = JSON.parse(localStorage.getItem('dpi-fieldbook-actors') || '[]');
    const existingNames = new Set(currentActors.map(a => a.name));
    const toAdd = data.actors.filter(a => !existingNames.has(a.name));
    
    const merged = [...currentActors, ...toAdd];
    localStorage.setItem('dpi-fieldbook-actors', JSON.stringify(merged));
    
    console.log(`Added ${toAdd.length} actors! Total: ${merged.length}`);
    alert('Actors imported! Refreshing...');
    window.location.reload();
  });
```

Or simply visit: **http://localhost:3000/init** and click the button!

