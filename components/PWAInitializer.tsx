'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/app/sw-register';

export default function PWAInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV !== 'production') {
        // Dev: aggressively unregister any existing SW and clear caches
        navigator.serviceWorker.getRegistrations()
          .then(regs => Promise.all(regs.map(r => r.unregister())))
          .then(() => caches.keys())
          .then(keys => Promise.all(keys.map(k => caches.delete(k))))
          .catch(() => {});
      } else {
        registerServiceWorker();
      }
    }
  }, []);
  
  return null;
}

