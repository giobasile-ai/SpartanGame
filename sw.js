
const CACHE_NAME = 'spartan-v5-cache';
const ASSETS = [
  './index.html?v=5',
  './manifest.json?v=5'
];

// PNG 192x192: Quadrato rosso scuro con Lambda (Λ) spartana stilizzata
const SPARTAN_ICON_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAAC6eR2NAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFMSURBVHhe7dPRKQRhFIXhsyMREfFvRETEvxEREX8jIiL+RkRE/E1ERPyNiIj4N0RERPxNRETE34iIiL8RERF/IyIi/kZERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETEv0RERPxtRETE30RERPxtRETE3zYikXf3AjYdC0+HtwAAAABJRU5ErkJggg==';

function base64ToResponse(base64) {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Response(array, {
    headers: { 
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache'
    }
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Intercettiamo i nuovi nomi file v5
  if (url.pathname.includes('spartan-v5-icon')) {
    event.respondWith(Promise.resolve(base64ToResponse(SPARTAN_ICON_PNG)));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
