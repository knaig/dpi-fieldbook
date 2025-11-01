'use client';

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // In development, ensure any existing service workers are unregistered to avoid stale caches
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      }).catch(() => {});
      return; // Skip registration in dev
    }
    // Register service worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker available');
                // You can show a toast notification here
              }
            });
          }
        });

        // Check for updates periodically (only in production or when explicitly needed)
        // Check less frequently to avoid unnecessary reloads
        setInterval(() => {
          registration.update();
        }, 300000); // Check every 5 minutes instead of every minute
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });

    // Handle service worker updates - only reload if actually needed
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Only reload if we're not already refreshing and it's not the initial install
      if (!refreshing && navigator.serviceWorker.controller) {
        refreshing = true;
        // Delay reload slightly to allow other operations to complete
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    });
  }
}

