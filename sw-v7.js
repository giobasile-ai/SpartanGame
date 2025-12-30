const CACHE_NAME = 'spartan-v7-cache-v2';
const ASSETS = [
  './index.html',
  './spartan-v7.webmanifest'
];

const ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAAC6eR2NAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDhIuK767pAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkZW5mdXNoAAAAQUlEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8BE4gAAB6S976wAAAABJRU5ErkJggg==';

function base64ToResponse(base64) {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Response(array, {
    headers: { 'Content-Type': 'image/png' }
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usiamo addAll ma con cautela
      return cache.addAll(ASSETS).catch(err => console.warn('Cache warm-up partial:', err));
    })
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
  
  if (url.pathname.includes('icon-v7-')) {
    event.respondWith(Promise.resolve(base64ToResponse(ICON_BASE64)));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});