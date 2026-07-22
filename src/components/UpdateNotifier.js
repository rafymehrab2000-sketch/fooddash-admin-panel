import { useEffect } from 'react';
import { useToast } from './Toast';

// Registers the service worker and watches for a new version becoming
// available. When one activates, it takes over immediately (see sw.js
// skipWaiting/clients.claim), so we show a toast and reload shortly after.
export default function UpdateNotifier() {
  const { showToast } = useToast();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    const reloadOnce = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const watchForUpdate = (registration) => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('Updating to latest version...', '', 'info');
          setTimeout(reloadOnce, 2000);
        }
      });
    };

    navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          registration.addEventListener('updatefound', () => watchForUpdate(registration));
        })
        .catch(err => console.error('SW registration failed:', err));
    };
    window.addEventListener('load', onLoad);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', reloadOnce);
      window.removeEventListener('load', onLoad);
    };
  }, [showToast]);

  return null;
}
